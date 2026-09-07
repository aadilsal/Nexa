"use client";

import { useAction } from "convex/react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChatMessageSchema } from "@nexa/shared";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/session";
import { track } from "@nexa/analytics/react";
import { FEATURE_HELP } from "@/lib/feature-help";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const chatInputSchema = ChatMessageSchema.pick({ message: true });
type ChatInput = { message: string };

export default function ChatPage() {
  const { token } = useSession();
  const chatAction = useAction(api.ai.chat);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isPending, setIsPending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChatInput>({
    resolver: zodResolver(chatInputSchema),
    mode: "onBlur",
    defaultValues: { message: "" },
  });

  async function onSubmit(data: ChatInput) {
    if (!token) return;
    setIsPending(true);
    try {
      const result = await chatAction({ sessionToken: token, message: data.message, history: messages.slice(-10) });
      track("ai_chat_message_sent");
      setMessages((prev) => [...prev, { role: "user", content: data.message }, { role: "assistant", content: result.reply }]);
      reset();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">Financial Chat</h1>
      <p className="mb-6 text-sm text-muted-foreground">{FEATURE_HELP.aiCoach}</p>

      <Card className="mb-4 flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Try: &quot;Why is my Safe To Spend lower today?&quot; or &quot;Am I on track for my emergency fund?&quot;
          </p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={msg.role === "user" ? "ml-8 rounded-lg bg-primary/10 p-3 text-sm" : "mr-8 rounded-lg bg-muted p-3 text-sm"}
              >
                {msg.content}
              </motion.div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </Card>

      <form className="space-y-2" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="flex gap-2">
          <Input placeholder="Ask about your finances..." disabled={isPending} error={!!errors.message} maxLength={2000} className="flex-1" {...register("message")} />
          <Button type="submit" disabled={isPending}>
            Send
          </Button>
        </div>
        {errors.message?.message ? (
          <p className="text-sm text-destructive" role="alert">
            {errors.message.message}
          </p>
        ) : null}
      </form>
    </>
  );
}

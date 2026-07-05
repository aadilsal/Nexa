"use client";

import { useMutation } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChatMessageSchema } from "@nexa/shared";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { track } from "@nexa/analytics/react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const chatInputSchema = ChatMessageSchema.pick({ message: true });
type ChatInput = { message: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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

  const mutation = useMutation({
    mutationFn: (message: string) =>
      api<{ reply: string }>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message,
          history: messages.slice(-10),
        }),
      }),
    onSuccess: (data, message) => {
      track("ai_chat_message_sent");
      setMessages((prev) => [
        ...prev,
        { role: "user", content: message },
        { role: "assistant", content: data.reply },
      ]);
      reset();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to send message"),
  });

  function onSubmit(data: ChatInput) {
    mutation.mutate(data.message);
  }

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">Financial Chat</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Ask about your finances. Grounded in your engine data — read-only.
      </p>

      <Card className="mb-4 flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Try: &quot;Why is my Safe To Spend lower today?&quot; or &quot;Am I on
            track for my emergency fund?&quot;
          </p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={
                  msg.role === "user"
                    ? "ml-8 rounded-lg bg-primary/10 p-3 text-sm"
                    : "mr-8 rounded-lg bg-muted p-3 text-sm"
                }
              >
                {msg.content}
              </motion.div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </Card>

      <form
        className="space-y-2"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="flex gap-2">
          <Input
            placeholder="Ask about your finances..."
            disabled={mutation.isPending}
            error={!!errors.message}
            maxLength={2000}
            className="flex-1"
            {...register("message")}
          />
          <Button type="submit" disabled={mutation.isPending}>
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

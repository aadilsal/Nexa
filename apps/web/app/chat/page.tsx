"use client";

import { useMutation } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { AppNav } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { captureEvent } from "@/lib/posthog";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

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
      captureEvent("ai_chat_message_sent");
      setMessages((prev) => [
        ...prev,
        { role: "user", content: message },
        { role: "assistant", content: data.reply },
      ]);
      setInput("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-8">
      <AppNav />
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
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim() && !mutation.isPending) {
            mutation.mutate(input.trim());
          }
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your finances..."
          disabled={mutation.isPending}
        />
        <Button type="submit" disabled={!input.trim() || mutation.isPending}>
          Send
        </Button>
      </form>
    </main>
  );
}

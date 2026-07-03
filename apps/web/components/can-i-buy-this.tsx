"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function CanIBuyThis() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "thinking" | "result">("idle");

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setStatus("thinking");
    setTimeout(() => setStatus("result"), 1500); // Mock API call
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) {
        setTimeout(() => { setStatus("idle"); setQuery(""); }, 300);
      }
    }}>
      <DialogTrigger asChild>
        <Button className="rounded-full shadow-sm gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
          <Search className="w-4 h-4" />
          Can I Buy This?
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-border bg-card shadow-floating">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Can I buy this?</DialogTitle>
          <DialogDescription>
            Ask Nexa how a purchase affects your goals.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.form 
              key="idle"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              onSubmit={handleAsk} 
              className="space-y-4 pt-4"
            >
              <Input 
                placeholder="e.g., A $5 coffee, or New MacBook for $2000" 
                value={query} 
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 text-lg"
                autoFocus
              />
              <Button type="submit" className="w-full h-11" disabled={!query.trim()}>
                Analyze Purchase
              </Button>
            </motion.form>
          )}

          {status === "thinking" && (
            <motion.div 
              key="thinking"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center justify-center space-y-4"
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">Analyzing your cash flow...</p>
            </motion.div>
          )}

          {status === "result" && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 pt-4"
            >
              <div className="rounded-xl border border-warning/20 bg-warning/10 p-4">
                <h4 className="font-bold text-warning text-lg">You can, but it will be tight.</h4>
                <p className="text-sm text-foreground/80 mt-1">Your Safe to Spend will drop significantly.</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 rounded bg-muted/50">
                  <span className="text-muted-foreground">Safe to Spend Impact</span>
                  <span className="font-mono text-destructive">-$2,000.00</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/50">
                  <span className="text-muted-foreground">Goal Delay</span>
                  <span className="font-medium text-warning">Bali Vacation (+2 weeks)</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>Cancel Purchase</Button>
                <Button variant="ghost" className="w-full text-muted-foreground">Log it anyway</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

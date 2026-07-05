"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TopProgressBarProps {
  active: boolean;
}

export function TopProgressBar({ active }: TopProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const wasActive = useRef(false);
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((id) => {
      window.clearTimeout(id);
      window.clearInterval(id);
    });
    timersRef.current = [];
  };

  useEffect(() => {
    clearTimers();

    if (active) {
      wasActive.current = true;
      setVisible(true);
      setProgress(10);

      timersRef.current.push(window.setTimeout(() => setProgress(32), 100));
      timersRef.current.push(window.setTimeout(() => setProgress(55), 320));

      const creep = window.setInterval(() => {
        setProgress((value) => (value >= 88 ? value : value + Math.random() * 5));
      }, 420);
      timersRef.current.push(creep);

      return clearTimers;
    }

    if (wasActive.current) {
      wasActive.current = false;
      setProgress(100);
      timersRef.current.push(
        window.setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 300),
      );
    }

    return clearTimers;
  }, [active]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px] bg-primary/10"
      role="progressbar"
      aria-label="Page loading"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
    >
      <div
        className={cn(
          "h-full bg-primary transition-[width] duration-300 ease-out",
          progress === 100 && "opacity-0 transition-[width,opacity] duration-300",
        )}
        style={{
          width: `${progress}%`,
          boxShadow: "0 0 10px color-mix(in oklch, var(--primary) 55%, transparent)",
        }}
      />
    </div>
  );
}

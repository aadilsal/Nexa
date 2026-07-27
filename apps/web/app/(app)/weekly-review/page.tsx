"use client";

import { useEffect } from "react";
import { useAppRouter } from "@/lib/navigation";

export default function WeeklyReviewRedirect() {
  const router = useAppRouter();

  useEffect(() => {
    router.replace("/reports");
  }, [router]);

  return null;
}

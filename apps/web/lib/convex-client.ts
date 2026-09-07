import { ConvexReactClient } from "convex/react";

const url = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";

if (!url && typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.error("NEXT_PUBLIC_CONVEX_URL is not set — Convex calls will fail.");
}

export const convex = new ConvexReactClient(url);

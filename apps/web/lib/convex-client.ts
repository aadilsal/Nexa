import { ConvexReactClient } from "convex/react";

// Strip trailing slashes: Convex builds `wss://${host}/api/...`, so "https://x.convex.cloud/"
// yields a "//api" sync path that never connects and silently queues every call.
const url = (process.env.NEXT_PUBLIC_CONVEX_URL ?? "").trim().replace(/\/+$/, "");

// NEXT_PUBLIC_* values are inlined at build time, so a missing URL would ship a
// broken client bundle. Fail loudly instead of with Convex's opaque URL error.
if (!/^https?:\/\//.test(url)) {
  throw new Error(
    `NEXT_PUBLIC_CONVEX_URL must be an absolute URL (got ${JSON.stringify(url)}). ` +
      "Set it in the Vercel project's Environment Variables (or ../../.env locally).",
  );
}

export const convex = new ConvexReactClient(url);

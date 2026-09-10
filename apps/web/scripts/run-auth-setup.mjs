// One-time owner setup, run locally to avoid the npx.cmd JSON-argument quoting problem
// on Windows. Reads the password from an env var instead of a shell-escaped JSON string.
//
// Usage (PowerShell):
//   $env:SETUP_PASSWORD = 'your-strong-password-here'
//   node scripts/run-auth-setup.mjs
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { readFileSync } from "node:fs";

function readConvexUrlFromEnvLocal() {
  if (process.env.CONVEX_URL_OVERRIDE) return process.env.CONVEX_URL_OVERRIDE.trim();
  const contents = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const match = contents.match(/^NEXT_PUBLIC_CONVEX_URL=(.+)$/m);
  if (!match) throw new Error("NEXT_PUBLIC_CONVEX_URL not found in apps/web/.env.local");
  return match[1].trim();
}

const password = process.env.SETUP_PASSWORD;
if (!password) {
  console.error("Set $env:SETUP_PASSWORD first, e.g.:");
  console.error("  $env:SETUP_PASSWORD = 'your-strong-password-here'");
  process.exit(1);
}

const convexUrl = readConvexUrlFromEnvLocal();
const client = new ConvexHttpClient(convexUrl);

try {
  const result = await client.action(api.auth.setup, { password });
  console.log("\n=== SAVE THESE NOW — shown only once ===\n");
  console.log("Scan this into your authenticator app (Google Authenticator/Authy/etc):");
  console.log(result.otpAuthUri);
  console.log("\nOr enter this secret manually:", result.totpSecret);
  console.log("\nRecovery codes (each is one-time-use, for if you lose your authenticator device):");
  for (const code of result.recoveryCodes) console.log("  " + code);
  console.log("\n=========================================\n");
} catch (err) {
  console.error("Setup failed:", err.message ?? err);
  process.exit(1);
}

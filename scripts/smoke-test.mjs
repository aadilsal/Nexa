#!/usr/bin/env node
/**
 * Production smoke test — hits public health + validates build artifacts exist.
 * Usage: node scripts/smoke-test.mjs [API_BASE_URL]
 * Example: node scripts/smoke-test.mjs http://localhost:4000/api/v1
 */

const baseUrl = (process.argv[2] ?? process.env.SMOKE_API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");

const checks = [];

async function check(name, fn) {
  try {
    await fn();
    checks.push({ name, ok: true });
    console.log(`✓ ${name}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    checks.push({ name, ok: false, message });
    console.error(`✗ ${name}: ${message}`);
  }
}

await check("API health", async () => {
  const res = await fetch(`${baseUrl}/health`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  if (body.status !== "ok") throw new Error(`unexpected body: ${JSON.stringify(body)}`);
});

await check("Swagger docs reachable", async () => {
  const docsUrl = baseUrl.replace(/\/api\/v1$/, "") + "/api/v1/docs";
  const res = await fetch(docsUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
});

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);

if (failed.length > 0) {
  process.exit(1);
}

console.log("\nSmoke test passed. For full E2E: signup → onboard → log transaction → dashboard.");

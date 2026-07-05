#!/usr/bin/env node
/**
 * Kill the process listening on a TCP port (Windows + Unix).
 * Usage: node scripts/kill-port.mjs 3000
 */
import { execSync } from "node:child_process";

const port = Number(process.argv[2]);
if (!port || Number.isNaN(port)) {
  console.error("Usage: node scripts/kill-port.mjs <port>");
  process.exit(1);
}

function killOnWindows() {
  const out = execSync(`netstat -ano | findstr :${port}`, {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "ignore"],
  });
  const pids = new Set(
    out
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.includes("LISTENING"))
      .map((line) => line.split(/\s+/).pop())
      .filter((pid) => pid && pid !== "0"),
  );

  if (pids.size === 0) {
    console.log(`No process listening on port ${port}`);
    return;
  }

  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      console.log(`Killed PID ${pid} on port ${port}`);
    } catch {
      console.warn(`Could not kill PID ${pid}`);
    }
  }
}

function killOnUnix() {
  try {
    const pid = execSync(`lsof -ti :${port}`, { encoding: "utf8" }).trim();
    if (!pid) {
      console.log(`No process listening on port ${port}`);
      return;
    }
    execSync(`kill -9 ${pid}`);
    console.log(`Killed PID ${pid} on port ${port}`);
  } catch {
    console.log(`No process listening on port ${port}`);
  }
}

if (process.platform === "win32") {
  killOnWindows();
} else {
  killOnUnix();
}

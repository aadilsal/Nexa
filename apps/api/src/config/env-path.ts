import { existsSync } from "fs";
import { join } from "path";

/** Resolve monorepo root (contains pnpm-workspace.yaml). */
export function getMonorepoRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    const parent = join(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return join(process.cwd(), "../..");
}

/** Single source of truth: repo-root `.env` only. */
export function getRootEnvPath(): string {
  return join(getMonorepoRoot(), ".env");
}

/**
 * Expand env URL lists into browser origins, including www ↔ apex pairs
 * so custom domains work when env vars only list one hostname.
 */
export function expandTrustedOrigins(
  ...sources: (string | undefined)[]
): string[] {
  const origins = new Set<string>();

  for (const source of sources) {
    if (!source) continue;

    for (const part of source.split(",")) {
      const raw = part.trim();
      if (!raw) continue;

      const parsed = parseOrigin(raw);
      if (!parsed) continue;

      origins.add(parsed.origin);

      const { hostname, protocol } = parsed;

      if (hostname.startsWith("www.")) {
        origins.add(`${protocol}//${hostname.slice(4)}`);
      } else if (
        hostname !== "localhost" &&
        !hostname.endsWith(".vercel.app") &&
        hostname.includes(".")
      ) {
        origins.add(`${protocol}//www.${hostname}`);
      }
    }
  }

  return [...origins];
}

function parseOrigin(
  raw: string,
): { origin: string; hostname: string; protocol: string } | null {
  const withProtocol = raw.includes("://") ? raw : `https://${raw}`;
  const match = withProtocol.match(/^(https?):\/\/([^/?#]+)/i);
  if (!match) return null;

  const protocol = match[1].toLowerCase();
  const host = match[2].toLowerCase();
  const hostname = host.split(":")[0] ?? host;

  return {
    protocol: `${protocol}:`,
    hostname,
    origin: `${protocol}://${host}`,
  };
}

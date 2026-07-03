import { createHmac } from "crypto";

export function hashUserId(userId: string): string {
  const salt = process.env.ANALYTICS_USER_HASH_SALT;
  if (!salt) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ANALYTICS_USER_HASH_SALT must be set in production");
    }
    return createHmac("sha256", "nexa-dev-analytics-salt").update(userId).digest("hex");
  }
  return createHmac("sha256", salt).update(userId).digest("hex");
}

export function hashIp(ip: string): string {
  const salt = process.env.ANALYTICS_USER_HASH_SALT ?? "nexa-dev-analytics-salt";
  return createHmac("sha256", salt).update(ip).digest("hex");
}

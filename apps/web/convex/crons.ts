import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("prune rate limit counters", { hours: 24 }, internal.lib.ratelimit._pruneOldCounters, {});
crons.interval("refresh exchange rates", { hours: 6 }, internal.currencies._fetchRatesAndCache, {});
crons.weekly(
  "send weekly review email",
  { dayOfWeek: "monday", hourUTC: 4, minuteUTC: 0 },
  internal.reviews.sendWeeklyReviewEmail,
  {},
);

export default crons;

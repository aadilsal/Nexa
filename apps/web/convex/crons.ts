import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("prune rate limit counters", { hours: 24 }, internal.lib.ratelimit._pruneOldCounters, {});
crons.interval("refresh exchange rates", { hours: 6 }, internal.currencies._fetchRatesAndCache, {});
// 04:00 UTC = 9:00 Pakistan time: bill due tomorrow, Zakat date, new-tax-year rates check.
crons.daily("daily reminders", { hourUTC: 4, minuteUTC: 0 }, internal.planning._dailyReminders, {});
crons.daily("gold and silver prices", { hourUTC: 3, minuteUTC: 30 }, internal.metals._fetch, {});

export default crons;

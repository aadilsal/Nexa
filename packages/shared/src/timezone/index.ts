import { z } from "zod";

/** IANA timezones available in profile settings. */
export const SUPPORTED_TIMEZONES = [
  "Asia/Karachi",
  "Asia/Dubai",
  "Asia/Muscat",
  "Asia/Riyadh",
  "Asia/Qatar",
  "Asia/Kuwait",
  "Asia/Bahrain",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Colombo",
  "Asia/Singapore",
  "Asia/Kuala_Lumpur",
  "Asia/Jakarta",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Australia/Sydney",
] as const;

export type TimezoneId = (typeof SUPPORTED_TIMEZONES)[number];

export const TimezoneSchema = z.enum(SUPPORTED_TIMEZONES);

export const DEFAULT_TIMEZONE: TimezoneId = "Asia/Karachi";

export const TIMEZONE_LABELS: Record<TimezoneId, string> = {
  "Asia/Karachi": "Pakistan (Karachi)",
  "Asia/Dubai": "United Arab Emirates (Dubai)",
  "Asia/Muscat": "Oman (Muscat)",
  "Asia/Riyadh": "Saudi Arabia (Riyadh)",
  "Asia/Qatar": "Qatar (Doha)",
  "Asia/Kuwait": "Kuwait",
  "Asia/Bahrain": "Bahrain",
  "Asia/Kolkata": "India (Kolkata)",
  "Asia/Dhaka": "Bangladesh (Dhaka)",
  "Asia/Colombo": "Sri Lanka (Colombo)",
  "Asia/Singapore": "Singapore",
  "Asia/Kuala_Lumpur": "Malaysia (Kuala Lumpur)",
  "Asia/Jakarta": "Indonesia (Jakarta)",
  "Europe/London": "United Kingdom (London)",
  "Europe/Berlin": "Central Europe (Berlin)",
  "America/New_York": "US Eastern (New York)",
  "America/Chicago": "US Central (Chicago)",
  "America/Denver": "US Mountain (Denver)",
  "America/Los_Angeles": "US Pacific (Los Angeles)",
  "America/Toronto": "Canada (Toronto)",
  "Australia/Sydney": "Australia (Sydney)",
};

export function isSupportedTimezone(value: string): value is TimezoneId {
  return (SUPPORTED_TIMEZONES as readonly string[]).includes(value);
}

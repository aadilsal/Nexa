export const CATEGORIES = [
  "FOOD",
  "FUEL",
  "SHOPPING",
  "ENTERTAINMENT",
  "UTILITIES",
  "HEALTHCARE",
  "TRANSPORT",
  "HOUSING",
  "EDUCATION",
  "CHARITY",
  "INVESTMENT",
  "INCOME",
  "OTHER",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const GOAL_PRIORITIES = [
  "EMERGENCY_FUND",
  "HIGH",
  "MEDIUM",
  "LOW",
] as const;

export type GoalPriority = (typeof GOAL_PRIORITIES)[number];

export const TRANSACTION_TYPES = ["INCOME", "EXPENSE"] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const CYCLE_STATUSES = [
  "ACTIVE",
  "COMPLETED",
  "PENDING_CONFIRMATION",
] as const;

export type CycleStatus = (typeof CYCLE_STATUSES)[number];

export const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  FOOD: [
    "food",
    "kfc",
    "mcdonalds",
    "pizza",
    "lunch",
    "dinner",
    "breakfast",
    "grocery",
    "al fatah",
    "metro",
    "imtiaz",
    "coffee",
    "cafe",
  ],
  FUEL: [
    "petrol",
    "fuel",
    "diesel",
    "cng",
    "gas station",
    "pso",
    "shell",
    "total parco",
  ],
  SHOPPING: ["shopping", "clothes", "shoes", "mall", "daraz", "amazon"],
  ENTERTAINMENT: [
    "netflix",
    "spotify",
    "movie",
    "cinema",
    "game",
    "entertainment",
    "cursor",
    "gym",
  ],
  UTILITIES: [
    "electricity",
    "gas bill",
    "water",
    "k-electric",
    "ssgc",
    "utility",
    "utilities",
    "internet",
    "mobile",
  ],
  HEALTHCARE: [
    "doctor",
    "hospital",
    "pharmacy",
    "medicine",
    "medical",
  ],
  TRANSPORT: [
    "uber",
    "careem",
    "bus",
    "rickshaw",
    "train",
    "flight",
    "toll",
  ],
  HOUSING: ["rent", "mortgage", "maintenance", "housing"],
  EDUCATION: ["tuition", "books", "course", "school", "university"],
  CHARITY: ["charity", "donation", "masjid", "mosque", "sadqa", "zakat"],
  INVESTMENT: ["investment", "stocks", "mutual fund"],
  INCOME: ["salary", "freelance", "bonus", "payment", "income", "freelancing"],
  OTHER: [],
};

export const INCOME_KEYWORDS = CATEGORY_KEYWORDS.INCOME;

export const ENGINE_VERSION = "1.0.0";

export const DEFAULT_EMERGENCY_FUND_MONTHS = 3;

export const DEFAULT_TIMEZONE = "Asia/Karachi";

export const DEFAULT_CURRENCY = "PKR";

export * from "./brand.js";
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
  "LOAN",
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

export const SUPPORT_TICKET_CATEGORIES = [
  "BUG",
  "FEEDBACK",
  "FEATURE_REQUEST",
  "OTHER",
] as const;

export type SupportTicketCategory = (typeof SUPPORT_TICKET_CATEGORIES)[number];

export const SUPPORT_TICKET_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_USER",
  "RESOLVED",
  "CLOSED",
] as const;

export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  FOOD: "Food",
  FUEL: "Fuel",
  SHOPPING: "Shopping",
  ENTERTAINMENT: "Entertainment",
  UTILITIES: "Utilities",
  HEALTHCARE: "Healthcare",
  TRANSPORT: "Transport",
  HOUSING: "Housing",
  EDUCATION: "Education",
  CHARITY: "Charity",
  INVESTMENT: "Investment",
  INCOME: "Income",
  LOAN: "Lent & borrowed",
  OTHER: "Other",
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  INCOME: "Income",
  EXPENSE: "Expense",
};

export const GOAL_PRIORITY_LABELS: Record<GoalPriority, string> = {
  EMERGENCY_FUND: "Emergency fund",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const SUPPORT_TICKET_CATEGORY_LABELS: Record<
  SupportTicketCategory,
  string
> = {
  BUG: "Bug report",
  FEEDBACK: "Feedback",
  FEATURE_REQUEST: "Feature request",
  OTHER: "Other",
};

export const SUPPORT_TICKET_STATUS_LABELS: Record<SupportTicketStatus, string> =
  {
    OPEN: "Open",
    IN_PROGRESS: "In progress",
    WAITING_USER: "Waiting on user",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
  };

export const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, i) => i + 1);

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
  // Money moved to/from people: changes cash but is not spending or income.
  LOAN: ["lent", "loan", "udhaar", "udhar", "borrow", "paid back", "repaid", "returned"],
  OTHER: [],
};

export const INCOME_KEYWORDS = CATEGORY_KEYWORDS.INCOME;

export const ENGINE_VERSION = "1.0.0";

export const DEFAULT_EMERGENCY_FUND_MONTHS = 3;

export { DEFAULT_TIMEZONE } from "../timezone/index.js";

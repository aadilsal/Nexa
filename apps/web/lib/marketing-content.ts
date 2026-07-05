import {
  Brain,
  Lock,
  Rocket,
  Shield,
  Sparkles,
} from "lucide-react";
import { BRAND } from "@/lib/brand";

export const QUICK_ANSWERS = [
  {
    question: "What is Nexa?",
    answer:
      "Pakistan's AI-powered financial intelligence platform. It tells you what you can safely spend today — and whether a purchase fits your goals — without spreadsheets or bank linking.",
    icon: Sparkles,
  },
  {
    question: "Why should I care?",
    answer:
      "Stop guessing at the ATM. Nexa turns your income, bills, and goals into one daily number — Safe To Spend — so you can spend without guilt or surprise.",
    icon: Brain,
  },
  {
    question: "Why is it different?",
    answer:
      "Not an expense tracker. Nexa answers forward-looking questions — Can I buy this? Am I on track? — using PKR-native payday cycles built for how Pakistan actually earns and spends.",
    icon: Rocket,
  },
  {
    question: "Is my data safe?",
    answer:
      "Yes. Your data is encrypted. We never ask for bank credentials. Our team cannot see your finances unless you choose to share a temporary support snapshot.",
    icon: Lock,
  },
  {
    question: "What's the first thing I should do?",
    answer:
      "Create a free account, add your income and fixed expenses, and set one goal. Nexa will show your Safe To Spend within minutes.",
    icon: Shield,
    cta: { label: "Get started free", href: "/signup" },
  },
] as const;

export const TRUST_SIGNALS = [
  "Envelope encryption at rest",
  "No bank linking required",
  "PKR-native payday cycles",
  "Export or delete your data anytime",
  "Passkeys & magic-link sign-in",
] as const;

export const LANDING_FAQ = [
  {
    q: "Is Nexa an expense tracker?",
    a: "No. Nexa is a financial intelligence platform. Expense logging is how we learn — the product is guidance: Safe To Spend, purchase simulations, and goal-aware decisions.",
  },
  {
    q: "Do I need to connect my bank?",
    a: "No. Nexa works without bank integrations. You enter income, fixed expenses, and log spending — we handle the intelligence.",
  },
  {
    q: "Who is Nexa built for?",
    a: "Salaried professionals, freelancers, and anyone in Pakistan who wants confident daily money decisions in PKR.",
  },
  {
    q: "How does Safe To Spend work?",
    a: "Each day, Nexa calculates how much you can safely spend based on your cycle, goals, fixed commitments, and spending trends.",
  },
  {
    q: "How much does Nexa cost?",
    a: "Nexa is free during early access. We'll announce pricing before any paid plans launch — existing users will get advance notice.",
  },
  {
    q: "Can I delete my account and data?",
    a: "Yes. From Profile → Data & privacy you can export a copy of your data or permanently delete your account at any time.",
  },
] as const;

export const FULL_FAQ = [
  ...LANDING_FAQ,
  {
    q: "Does Nexa sell my financial data?",
    a: "Never. We do not sell, rent, or share your financial data with advertisers or data brokers. See our Privacy Policy for full details.",
  },
  {
    q: "Where is my data stored?",
    a: "Nexa runs on secure cloud infrastructure with encryption at rest and in transit. We follow industry-standard security practices and regularly review our controls.",
  },
  {
    q: "How does the AI coach work?",
    a: "The AI coach explains your numbers in plain language — grounded in Nexa's financial engine, not generic tips. It cannot move money or change your data without your action.",
  },
  {
    q: "What currencies does Nexa support?",
    a: "Nexa is built for Pakistani Rupees (PKR) with payday-to-payday cycles. Multi-currency support is on our roadmap.",
  },
] as const;

export type ChangelogEntry = {
  date: string;
  version: string;
  title: string;
  items: string[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-07",
    version: "0.9",
    title: "Early access launch",
    items: [
      "Safe To Spend dashboard with financial health score",
      "Can I Buy This? purchase simulation",
      "AI financial coach with engine-grounded answers",
      "Goal planning with on-track signals",
      "Five-second expense logging",
      "Passkeys and magic-link authentication",
      "Data export and account deletion",
    ],
  },
  {
    date: "2026-06",
    version: "0.8",
    title: "Private beta",
    items: [
      "Weekly review summaries",
      "Onboarding flow for income and fixed expenses",
      "Envelope encryption for sensitive fields",
      "Support snapshot for optional troubleshooting",
    ],
  },
];

export type RoadmapItem = {
  title: string;
  description: string;
  status: "shipped" | "in-progress" | "planned";
};

export const ROADMAP: RoadmapItem[] = [
  {
    title: "Safe To Spend & Can I Buy?",
    description: "Daily spending allowance and purchase simulations with clear GO / WAIT guidance.",
    status: "shipped",
  },
  {
    title: "AI financial coach",
    description: "Plain-language explanations grounded in your real numbers.",
    status: "shipped",
  },
  {
    title: "Goal planning & weekly review",
    description: "Track milestones and get a calm weekly summary of your progress.",
    status: "shipped",
  },
  {
    title: "Mobile-optimized experience",
    description: "Faster logging and dashboard tuned for phone-first usage in Pakistan.",
    status: "in-progress",
  },
  {
    title: "Urdu language support",
    description: "Full UI and AI coach responses in Urdu.",
    status: "planned",
  },
  {
    title: "Family & shared goals",
    description: "Household budgeting with privacy-preserving shared visibility.",
    status: "planned",
  },
  {
    title: "Bill reminders",
    description: "Gentle nudges for recurring commitments before they're due.",
    status: "planned",
  },
];

export const SUPPORT_EMAIL = "support@nexa.app";

export const COMPANY_LOCATION = "Karachi, Pakistan";

export function getMarketingMeta(page: string) {
  return {
    title: `${page} · ${BRAND.name}`,
    description: BRAND.description,
  };
}

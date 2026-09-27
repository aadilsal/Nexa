import {
  Bus,
  Clapperboard,
  Fuel,
  GraduationCap,
  HandCoins,
  HandHeart,
  HeartPulse,
  Home,
  MoreHorizontal,
  ShoppingBag,
  TrendingUp,
  Utensils,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@nexa/shared";

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  FOOD: Utensils,
  FUEL: Fuel,
  SHOPPING: ShoppingBag,
  ENTERTAINMENT: Clapperboard,
  UTILITIES: Zap,
  HEALTHCARE: HeartPulse,
  TRANSPORT: Bus,
  HOUSING: Home,
  EDUCATION: GraduationCap,
  CHARITY: HandHeart,
  INVESTMENT: TrendingUp,
  INCOME: Wallet,
  LOAN: HandCoins,
  OTHER: MoreHorizontal,
};

/** Soft tinted badge per category (icon colour + background), for scannable lists.
 *  Colour is always paired with the icon and label, never the only signal. */
export const CATEGORY_TONES: Record<Category, string> = {
  FOOD: "bg-orange-50 text-orange-700",
  FUEL: "bg-amber-50 text-amber-700",
  SHOPPING: "bg-pink-50 text-pink-700",
  ENTERTAINMENT: "bg-purple-50 text-purple-700",
  UTILITIES: "bg-sky-50 text-sky-700",
  HEALTHCARE: "bg-rose-50 text-rose-700",
  TRANSPORT: "bg-cyan-50 text-cyan-700",
  HOUSING: "bg-indigo-50 text-indigo-700",
  EDUCATION: "bg-blue-50 text-blue-700",
  CHARITY: "bg-teal-50 text-teal-700",
  INVESTMENT: "bg-violet-50 text-violet-700",
  INCOME: "bg-emerald-50 text-emerald-700",
  LOAN: "bg-yellow-50 text-yellow-800",
  OTHER: "bg-slate-100 text-slate-600",
};

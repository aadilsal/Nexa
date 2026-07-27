import {
  Bus,
  Clapperboard,
  Fuel,
  GraduationCap,
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
  OTHER: MoreHorizontal,
};

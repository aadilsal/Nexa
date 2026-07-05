import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { formatMoney } from "@nexa/shared";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { formatMoney };

/** @deprecated Use formatMoney(amount, currency) or useCurrency().formatAmount */
export function formatPKR(amount: number): string {
  return formatMoney(amount, "PKR");
}

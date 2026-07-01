import { z } from "zod";
import {
  CATEGORIES,
  GOAL_PRIORITIES,
  TRANSACTION_TYPES,
} from "../constants/index.js";

export const CategorySchema = z.enum(CATEGORIES);
export const GoalPrioritySchema = z.enum(GOAL_PRIORITIES);
export const TransactionTypeSchema = z.enum(TRANSACTION_TYPES);

export const ParseTransactionSchema = z.object({
  rawInput: z.string().min(1).max(200),
});

export const ParsedTransactionSchema = z.object({
  description: z.string(),
  amount: z.number().int().positive(),
  category: CategorySchema,
  type: TransactionTypeSchema,
  confidence: z.number().min(0).max(1),
});

export const CreateTransactionSchema = z.object({
  rawInput: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(200).optional(),
  amount: z.number().int().positive().optional(),
  category: CategorySchema.optional(),
  type: TransactionTypeSchema.optional(),
});

export const CorrectTransactionSchema = z.object({
  description: z.string().min(1).max(200).optional(),
  amount: z.number().int().positive().optional(),
  category: CategorySchema.optional(),
  type: TransactionTypeSchema.optional(),
});

export const RecategorizeTransactionSchema = z.object({
  category: CategorySchema,
});

export const FixedExpenseInputSchema = z.object({
  name: z.string().min(1).max(100),
  category: CategorySchema,
  expectedAmount: z.number().int().nonnegative(),
});

export const IncomeExpectationInputSchema = z.object({
  name: z.string().min(1).max(100),
  expectedAmount: z.number().int().nonnegative(),
});

export const GoalInputSchema = z.object({
  name: z.string().min(1).max(100),
  targetAmount: z.number().int().positive(),
  targetDate: z.string().datetime().or(z.string().date()),
  priority: GoalPrioritySchema,
  isEmergencyFund: z.boolean().optional(),
});

export const OnboardingPreviewSchema = z.object({
  variableEstimate: z.number().int().nonnegative(),
  fixedExpenses: z.array(FixedExpenseInputSchema).min(1),
});

export const OnboardingSchema = z.object({
  primaryPayday: z.number().int().min(1).max(31).optional(),
  preferredCycleStart: z.number().int().min(1).max(31).optional(),
  startingBalance: z.number().int().nonnegative().optional(),
  variableEstimate: z.number().int().nonnegative(),
  fixedExpenses: z.array(FixedExpenseInputSchema).min(1),
  incomeExpectations: z.array(IncomeExpectationInputSchema).min(1),
  goals: z.array(GoalInputSchema).optional(),
  emergencyFundTarget: z.number().int().positive().optional(),
});

export const ConfirmRolloverSchema = z.object({});

export const AdjustRolloverSchema = z.object({
  startingBalance: z.number().int().nonnegative(),
});

export const UpdateGoalSchema = GoalInputSchema.partial();

export const UpdateFixedExpenseSchema = z.object({
  expectedAmount: z.number().int().nonnegative(),
});

export const UpdateIncomeExpectationSchema = z.object({
  expectedAmount: z.number().int().nonnegative(),
});

export const PurchaseSimulationSchema = z.object({
  itemName: z.string().min(1).max(200),
  amount: z.number().int().positive(),
  purchaseDate: z.string().datetime().optional(),
});

export const ChatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .max(20)
    .optional(),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export const UpdateUserSettingsSchema = z.object({
  timezone: z.string().min(1).max(64).optional(),
  weeklyReviewEmail: z.boolean().optional(),
  passkeyPromptDismissed: z.boolean().optional(),
});

export type ParseTransactionInput = z.infer<typeof ParseTransactionSchema>;
export type ParsedTransaction = z.infer<typeof ParsedTransactionSchema>;
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type OnboardingInput = z.infer<typeof OnboardingSchema>;
export type OnboardingPreviewInput = z.infer<typeof OnboardingPreviewSchema>;
export type GoalInput = z.infer<typeof GoalInputSchema>;
export type PurchaseSimulationInput = z.infer<typeof PurchaseSimulationSchema>;
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;

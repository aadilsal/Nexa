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

export const SupportTicketCategorySchema = z.enum([
  "BUG",
  "FEEDBACK",
  "FEATURE_REQUEST",
  "OTHER",
]);

export const CreateSupportTicketSchema = z.object({
  category: SupportTicketCategorySchema,
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  includeSnapshot: z.boolean().optional(),
  snapshotConsent: z.boolean().optional(),
  route: z.string().max(500).optional(),
  browser: z.string().max(100).optional(),
  os: z.string().max(100).optional(),
  deviceType: z.string().max(50).optional(),
  appVersion: z.string().max(50).optional(),
  consoleErrors: z.array(z.string().max(500)).max(20).optional(),
});

export const PublicContactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  message: z.string().min(1).max(5000),
});

export const AnalyticsEventSchema = z.object({
  event: z.string().min(1).max(100),
  properties: z
    .record(z.union([z.string(), z.number(), z.boolean(), z.null()]))
    .optional(),
  route: z.string().max(500).optional(),
  referrer: z.string().max(500).optional(),
  appVersion: z.string().max(50).optional(),
  platform: z.string().max(50).optional(),
  browser: z.string().max(100).optional(),
  os: z.string().max(100).optional(),
  deviceType: z.string().max(50).optional(),
  sessionId: z.string().max(100).optional(),
  timestamp: z.string().datetime().optional(),
});

export const AnalyticsBatchSchema = z.object({
  events: z.array(AnalyticsEventSchema).min(1).max(50),
});

export const ErrorReportSchema = z.object({
  source: z.enum(["frontend", "backend"]),
  errorType: z.string().max(100),
  message: z.string().max(2000),
  stackTrace: z.string().max(10000).optional(),
  route: z.string().max(500).optional(),
  browser: z.string().max(100).optional(),
  os: z.string().max(100).optional(),
  appVersion: z.string().max(50).optional(),
});

export const UpdateSupportTicketStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_USER", "RESOLVED", "CLOSED"]),
});

export const ViewSnapshotSchema = z.object({
  reason: z.string().min(10).max(500),
});

export const AdminMfaSetupSchema = z.object({
  code: z.string().length(6).regex(/^\d+$/),
});

export const AdminMfaVerifySchema = z.object({
  code: z.string().length(6).regex(/^\d+$/),
});

export const AnalyticsBatchSignedSchema = AnalyticsBatchSchema.extend({
  signature: z.string().optional(),
});

export type CreateSupportTicketInput = z.infer<typeof CreateSupportTicketSchema>;
export type PublicContactInput = z.infer<typeof PublicContactSchema>;
export type AnalyticsBatchInput = z.infer<typeof AnalyticsBatchSchema>;
export type ParsedTransaction = z.infer<typeof ParsedTransactionSchema>;
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type OnboardingInput = z.infer<typeof OnboardingSchema>;
export type OnboardingPreviewInput = z.infer<typeof OnboardingPreviewSchema>;
export type GoalInput = z.infer<typeof GoalInputSchema>;
export type PurchaseSimulationInput = z.infer<typeof PurchaseSimulationSchema>;
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;

import { z } from "zod";
import {
  CATEGORIES,
  GOAL_PRIORITIES,
  TRANSACTION_TYPES,
} from "../constants/index.js";
import { CurrencySchema } from "../currency/index.js";
import { TimezoneSchema } from "../timezone/index.js";

export const CategorySchema = z.enum(CATEGORIES);
export const GoalPrioritySchema = z.enum(GOAL_PRIORITIES);
export const TransactionTypeSchema = z.enum(TRANSACTION_TYPES);

export const ParseTransactionSchema = z.object({
  rawInput: z
    .string()
    .trim()
    .min(1, "Enter a description and amount")
    .max(200, "Entry must be 200 characters or less"),
  currency: CurrencySchema.optional(),
});

export const ParsedTransactionSchema = z.object({
  description: z.string(),
  amount: z.number().int().positive(),
  category: CategorySchema,
  type: TransactionTypeSchema,
  currency: CurrencySchema.optional(),
  confidence: z.number().min(0).max(1),
});

export const CreateTransactionSchema = z.object({
  rawInput: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(200).optional(),
  amount: z.number().int().positive().optional(),
  category: CategorySchema.optional(),
  type: TransactionTypeSchema.optional(),
  currency: CurrencySchema.optional(),
});

export const CorrectTransactionSchema = z.object({
  description: z.string().min(1).max(200).optional(),
  amount: z.number().int().positive().optional(),
  category: CategorySchema.optional(),
  type: TransactionTypeSchema.optional(),
  currency: CurrencySchema.optional(),
});

export const RecategorizeTransactionSchema = z.object({
  category: CategorySchema,
});

export const FixedExpenseInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Expense name is required")
    .max(100, "Name must be 100 characters or less"),
  category: CategorySchema,
  expectedAmount: z
    .number()
    .int("Amount must be a whole number")
    .nonnegative("Amount cannot be negative"),
  currency: CurrencySchema.optional(),
});

export const IncomeExpectationInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Income source name is required")
    .max(100, "Name must be 100 characters or less"),
  expectedAmount: z
    .number()
    .int("Amount must be a whole number")
    .nonnegative("Amount cannot be negative"),
  currency: CurrencySchema.optional(),
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
  primaryCurrency: CurrencySchema.optional(),
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
  primaryCurrency: CurrencySchema.optional(),
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
  itemName: z
    .string()
    .trim()
    .min(1, "Item name is required")
    .max(200, "Item name must be 200 characters or less"),
  amount: z
    .number()
    .int("Amount must be a whole number")
    .positive("Amount must be greater than 0"),
  currency: CurrencySchema.optional(),
  purchaseDate: z.string().datetime().optional(),
});

export const PurchaseSimulationFormSchema = z.object({
  itemName: z
    .string()
    .trim()
    .min(1, "Item name is required")
    .max(200, "Item name must be 200 characters or less"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => /^\d+$/.test(v), "Enter a valid whole number")
    .refine((v) => Number(v) > 0, "Amount must be greater than 0"),
  currency: CurrencySchema.optional(),
});

export const ChatMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(2000, "Message must be 2000 characters or less"),
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
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less")
    .optional(),
});

export const ProfileNameFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
});

const emailField = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address");

export const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[0-9]/, "Include at least one number");

export const AuthSignUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  email: emailField,
  password: passwordField,
});

export const AuthSignUpFormSchema = AuthSignUpSchema.extend({
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the Terms of Service and Privacy Policy",
  }),
});

export const AuthSignInSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

export const AuthForgotPasswordSchema = z.object({
  email: emailField,
});

export const AuthResetPasswordSchema = z.object({
  password: passwordField,
});

export const UpdateUserSettingsSchema = z.object({
  timezone: TimezoneSchema.optional(),
  weeklyReviewEmail: z.boolean().optional(),
  passkeyPromptDismissed: z.boolean().optional(),
  primaryCurrency: CurrencySchema.optional(),
});

export const ProfileCurrencyFormSchema = z.object({
  primaryCurrency: CurrencySchema,
});

export const ProfileTimezoneFormSchema = z.object({
  timezone: TimezoneSchema,
});

export const SupportTicketCategorySchema = z.enum([
  "BUG",
  "FEEDBACK",
  "FEATURE_REQUEST",
  "OTHER",
]);

export const SupportTicketStatusSchema = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "WAITING_USER",
  "RESOLVED",
  "CLOSED",
]);

export const CreateSupportTicketSchema = z.object({
  category: SupportTicketCategorySchema,
  subject: z
    .string()
    .trim()
    .min(1, "Subject is required")
    .max(200, "Subject must be 200 characters or less"),
  description: z
    .string()
    .trim()
    .min(10, "Please describe your issue in at least 10 characters")
    .max(5000, "Description is too long"),
  route: z.string().max(500).optional(),
  browser: z.string().max(100).optional(),
  os: z.string().max(100).optional(),
  deviceType: z.string().max(50).optional(),
  appVersion: z.string().max(50).optional(),
  consoleErrors: z.array(z.unknown()).optional(),
  includeSnapshot: z.boolean().optional(),
  snapshotConsent: z.boolean().optional(),
});

export const CreateSupportTicketFormSchema = CreateSupportTicketSchema.pick({
  category: true,
  subject: true,
  description: true,
});

export const PublicContactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  email: emailField,
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message is too long"),
});

export const UpdateSupportTicketStatusSchema = z.object({
  status: SupportTicketStatusSchema,
});

export const ViewSnapshotSchema = z.object({
  reason: z.string().min(3).max(500),
});

export const AdminMfaSetupSchema = z.object({
  code: z.string().length(6).regex(/^\d+$/),
});

export const AdminMfaVerifySchema = z.object({
  code: z.string().length(6).regex(/^\d+$/),
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
  events: z.array(AnalyticsEventSchema).min(1).max(100),
});

export const ErrorReportSchema = z.object({
  source: z.string().min(1).max(100),
  errorType: z.string().min(1).max(100),
  message: z.string().min(1).max(2000),
  stackTrace: z.string().max(10000).optional(),
  route: z.string().max(500).optional(),
  browser: z.string().max(100).optional(),
  os: z.string().max(100).optional(),
  appVersion: z.string().max(50).optional(),
});

export type ParseTransactionInput = z.infer<typeof ParseTransactionSchema>;
export type ParsedTransaction = z.infer<typeof ParsedTransactionSchema>;
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type OnboardingInput = z.infer<typeof OnboardingSchema>;
export type OnboardingPreviewInput = z.infer<typeof OnboardingPreviewSchema>;
export type GoalInput = z.infer<typeof GoalInputSchema>;
export type PurchaseSimulationInput = z.infer<typeof PurchaseSimulationSchema>;
export type PurchaseSimulationFormInput = z.infer<
  typeof PurchaseSimulationFormSchema
>;
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;
export type CreateSupportTicketFormInput = z.infer<
  typeof CreateSupportTicketFormSchema
>;
export type ProfileNameFormInput = z.infer<typeof ProfileNameFormSchema>;
export type ProfileTimezoneFormInput = z.infer<
  typeof ProfileTimezoneFormSchema
>;
export type ProfileCurrencyFormInput = z.infer<
  typeof ProfileCurrencyFormSchema
>;
export type AuthSignUpInput = z.infer<typeof AuthSignUpSchema>;
export type AuthSignUpFormInput = z.infer<typeof AuthSignUpFormSchema>;
export type AuthSignInInput = z.infer<typeof AuthSignInSchema>;
export type AuthForgotPasswordInput = z.infer<typeof AuthForgotPasswordSchema>;
export type AuthResetPasswordInput = z.infer<typeof AuthResetPasswordSchema>;
export type PublicContactInput = z.infer<typeof PublicContactSchema>;

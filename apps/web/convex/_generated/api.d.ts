/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as currencies from "../currencies.js";
import type * as cycles from "../cycles.js";
import type * as dashboard from "../dashboard.js";
import type * as engine from "../engine.js";
import type * as export_ from "../export.js";
import type * as financialPlan from "../financialPlan.js";
import type * as goals from "../goals.js";
import type * as http from "../http.js";
import type * as ingest from "../ingest.js";
import type * as ledger from "../ledger.js";
import type * as lib_claude from "../lib/claude.js";
import type * as lib_crypto from "../lib/crypto.js";
import type * as lib_dek from "../lib/dek.js";
import type * as lib_password from "../lib/password.js";
import type * as lib_ratelimit from "../lib/ratelimit.js";
import type * as lib_session from "../lib/session.js";
import type * as lib_totp from "../lib/totp.js";
import type * as planning from "../planning.js";
import type * as push from "../push.js";
import type * as pushNode from "../pushNode.js";
import type * as reports from "../reports.js";
import type * as reviews from "../reviews.js";
import type * as settings from "../settings.js";
import type * as transactions from "../transactions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  auth: typeof auth;
  crons: typeof crons;
  currencies: typeof currencies;
  cycles: typeof cycles;
  dashboard: typeof dashboard;
  engine: typeof engine;
  export: typeof export_;
  financialPlan: typeof financialPlan;
  goals: typeof goals;
  http: typeof http;
  ingest: typeof ingest;
  ledger: typeof ledger;
  "lib/claude": typeof lib_claude;
  "lib/crypto": typeof lib_crypto;
  "lib/dek": typeof lib_dek;
  "lib/password": typeof lib_password;
  "lib/ratelimit": typeof lib_ratelimit;
  "lib/session": typeof lib_session;
  "lib/totp": typeof lib_totp;
  planning: typeof planning;
  push: typeof push;
  pushNode: typeof pushNode;
  reports: typeof reports;
  reviews: typeof reviews;
  settings: typeof settings;
  transactions: typeof transactions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

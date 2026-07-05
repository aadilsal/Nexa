import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer, magicLink } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { PrismaClient } from "@prisma/client";
import { sendAuthEmail, appUrl } from "./email";
import { getPrimaryAppOrigin, getTrustedOrigins } from "./trusted-origins";

const prisma = new PrismaClient();

const trustedOrigins = getTrustedOrigins();
const primaryAppOrigin = getPrimaryAppOrigin();

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      void sendAuthEmail({
        to: user.email,
        type: "password-reset",
        firstName: user.name,
        url,
      });
    },
    onPasswordReset: async ({ user }) => {
      void sendAuthEmail({
        to: user.email,
        type: "password-changed",
        firstName: user.name,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      void sendAuthEmail({
        to: user.email,
        type: "verify-email",
        firstName: user.name,
        url,
      });
    },
    afterEmailVerification: async (user) => {
      void sendAuthEmail({
        to: user.email,
        type: "welcome",
        firstName: user.name,
        url: appUrl("/onboarding"),
      });
    },
  },
  plugins: [
    bearer(),
    magicLink({
      expiresIn: 300,
      sendMagicLink: async ({ email, url }) => {
        void sendAuthEmail({
          to: email,
          type: "magic-link",
          email,
          url,
        });
      },
    }),
    passkey({
      rpName: "Nexa",
      rpID: process.env.PASSKEY_RP_ID ?? "localhost",
      origin: primaryAppOrigin,
    }),
  ],
  trustedOrigins,
  secret:
    process.env.BETTER_AUTH_SECRET ??
    "nexa-dev-secret-change-in-production-min-32-chars",
  baseURL: primaryAppOrigin,
});

export type Session = typeof auth.$Infer.Session;

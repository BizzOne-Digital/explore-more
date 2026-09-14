import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import type { Role } from "@/lib/constants";
import { authConfig } from "./config";
import { findUserByLoginIdentifier } from "@/lib/auth/find-user-by-login-identifier";

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(8),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email or ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { verifyPassword, isAccountLocked, getLockUntil } = await import("@/lib/password");

        const user = await findUserByLoginIdentifier(parsed.data.email);

        if (!user || !user.isActive) return null;

        if (isAccountLocked(user.lockUntil)) {
          throw new Error("Account temporarily locked. Try again later.");
        }

        const valid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!valid) {
          user.loginAttempts += 1;
          user.lockUntil = getLockUntil(user.loginAttempts);
          await user.save();
          return null;
        }

        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();

        if (user.role === "parent") {
          const { claimPendingMembership } = await import("@/lib/billing/membership-activation");
          await claimPendingMembership(user._id.toString(), user.email);
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role as Role,
          emailVerified: user.emailVerified,
          image: user.avatar,
        };
      },
    }),
  ],
});

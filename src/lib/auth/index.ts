import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import connectDB from "@/lib/db";
import { User } from "@/models";
import type { Role } from "@/lib/constants";
import { authConfig } from "./config";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { verifyPassword, isAccountLocked, getLockUntil } = await import("@/lib/password");

        await connectDB();
        const user = await User.findOne({ email: parsed.data.email.toLowerCase() });

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

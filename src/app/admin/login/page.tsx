"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormField, TextInput, FormActions } from "@/components/admin/forms";
import { COMPANY } from "@/lib/constants";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginForm) {
    setError(null);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();

    if (session?.user?.role !== "administrator") {
      setError("Access denied. Administrator account required.");
      await fetch("/api/auth/signout", { method: "POST" });
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center overflow-x-clip bg-explore-charcoal px-3 sm:px-4">
      <div className="w-full min-w-0 max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-semibold text-white">
            Admin Portal
          </h1>
          <p className="mt-2 text-sm text-white/50">{COMPANY.name}</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 rounded-2xl border border-white/10 bg-explore-black/60 p-8 backdrop-blur-sm"
        >
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <FormField label="Email" error={errors.email} required>
            <TextInput
              registration={register("email")}
              error={errors.email}
              type="email"
              autoComplete="email"
              placeholder="admin@example.com"
            />
          </FormField>

          <FormField label="Password" error={errors.password} required>
            <TextInput
              registration={register("password")}
              error={errors.password}
              type="password"
              autoComplete="current-password"
            />
          </FormField>

          <FormActions isSubmitting={isSubmitting} submitLabel="Sign in" />
        </form>
      </div>
    </div>
  );
}

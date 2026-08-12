"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface NewsletterFormProps {
  variant?: "inline" | "stacked";
  dark?: boolean;
}

const inlineInputClass =
  "h-11 w-full min-w-0 rounded-xl border border-white/25 bg-white/15 px-4 text-sm text-white placeholder:text-white/50 transition-colors focus:border-white/40 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50";

export function NewsletterForm({ variant = "stacked", dark = false }: NewsletterFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to subscribe");
      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "success") {
    return (
      <p className={dark ? "text-explore-lime font-medium" : "text-explore-forest font-medium"}>
        You&apos;re on the list! Check your inbox to confirm.
      </p>
    );
  }

  if (variant === "inline") {
    return (
      <div className="mx-auto w-full max-w-xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            name="email"
            type="email"
            required
            placeholder="your@email.com"
            disabled={status === "loading"}
            className={cn(
              inlineInputClass,
              !dark &&
                "border-explore-charcoal/15 bg-white text-explore-charcoal placeholder:text-explore-charcoal/40 focus:border-explore-teal focus:bg-white focus:ring-explore-teal/20"
            )}
          />
          <Button
            type="submit"
            variant={dark ? "lime" : "secondary"}
            disabled={status === "loading"}
            className="h-11 w-full shrink-0 rounded-xl px-8 sm:w-auto"
          >
            {status === "loading" ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>
        {error && <p className="mt-3 text-center text-sm text-red-300">{error}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        name="email"
        type="email"
        required
        placeholder="your@email.com"
        className={dark ? "bg-white/10 border-white/20 text-white placeholder:text-white/50" : undefined}
      />
      <Input name="name" placeholder="Your name (optional)" />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" variant={dark ? "lime" : "secondary"} disabled={status === "loading"}>
        {status === "loading" ? "Subscribing..." : "Subscribe"}
      </Button>
    </form>
  );
}

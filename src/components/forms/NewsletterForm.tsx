"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface NewsletterFormProps {
  variant?: "inline" | "stacked";
  dark?: boolean;
}

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

  return (
    <form
      onSubmit={handleSubmit}
      className={variant === "inline" ? "flex flex-col sm:flex-row gap-3" : "space-y-4"}
    >
      <Input
        name="email"
        type="email"
        required
        placeholder="your@email.com"
        className={dark ? "bg-white/10 border-white/20 text-white placeholder:text-white/50" : undefined}
      />
      {variant === "stacked" && (
        <Input name="name" placeholder="Your name (optional)" />
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" variant={dark ? "lime" : "secondary"} disabled={status === "loading"}>
        {status === "loading" ? "Subscribing..." : "Subscribe"}
      </Button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to send message");
      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl bg-explore-forest/10 border border-explore-forest/20 p-8 text-center">
        <p className="font-display text-xl font-bold text-explore-forest">Message sent!</p>
        <p className="mt-2 text-sm text-explore-charcoal/70">
          Thank you for reaching out. We&apos;ll get back to you soon.
        </p>
        <Button variant="secondary" className="mt-6" onClick={() => setStatus("idle")}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input name="name" label="Your Name" required placeholder="Jane Smith" />
        <Input name="email" type="email" label="Email" required placeholder="you@example.com" />
      </div>
      <Input name="phone" type="tel" label="Phone (optional)" placeholder="(555) 123-4567" />
      <Input name="subject" label="Subject" placeholder="Program inquiry" />
      <Textarea name="message" label="Message" required placeholder="Tell us how we can help..." rows={5} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={status === "loading"} size="lg">
        {status === "loading" ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}

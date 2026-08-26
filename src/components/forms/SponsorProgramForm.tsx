"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { formatCents } from "@/lib/utils";

interface SponsorProgramFormProps {
  programSlug: string;
  programTitle: string;
  suggestedAmounts: number[];
}

export function SponsorProgramForm({
  programSlug,
  programTitle,
  suggestedAmounts,
}: SponsorProgramFormProps) {
  const [amount, setAmount] = useState(suggestedAmounts[0] || 2500);
  const [customAmount, setCustomAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const finalAmount = customAmount ? Math.round(parseFloat(customAmount) * 100) : amount;

    if (isNaN(finalAmount) || finalAmount < 100) {
      setError("Minimum sponsorship is $1.00");
      setStatus("error");
      return;
    }

    try {
      const res = await fetch("/api/checkout/sponsor-program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programSlug,
          amountCents: finalAmount,
          donorName: data.donorName,
          donorEmail: data.donorEmail,
          message: data.message,
          isAnonymous: data.isAnonymous === "on",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Sponsorship failed");
      if (json.checkoutUrl) window.location.href = json.checkoutUrl;
      else if (json.success) window.location.href = `/sponsor-a-kid?sponsored=${programSlug}`;
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="text-sm font-medium text-explore-charcoal mb-3">Select amount</p>
        <div className="flex flex-wrap gap-2">
          {suggestedAmounts.map((cents) => (
            <button
              key={cents}
              type="button"
              onClick={() => {
                setAmount(cents);
                setCustomAmount("");
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                amount === cents && !customAmount
                  ? "bg-explore-orange text-white"
                  : "bg-explore-charcoal/8 text-explore-charcoal hover:bg-explore-charcoal/12"
              }`}
            >
              {formatCents(cents)}
            </button>
          ))}
        </div>
      </div>
      <Input
        label="Custom amount ($)"
        type="number"
        min="1"
        step="0.01"
        value={customAmount}
        onChange={(e) => setCustomAmount(e.target.value)}
        placeholder="Enter amount"
      />
      <Input name="donorName" label="Your Name" required />
      <Input name="donorEmail" type="email" label="Email" required />
      <Textarea
        name="message"
        label="Message (optional)"
        rows={3}
        placeholder={`Supporting ${programTitle}`}
      />
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" name="isAnonymous" className="rounded" />
        <span className="text-sm text-explore-charcoal/70">Make my sponsorship anonymous</span>
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="lg" disabled={status === "loading"} className="w-full">
        {status === "loading"
          ? "Processing..."
          : `Sponsor ${customAmount ? `$${customAmount}` : formatCents(amount)}`}
      </Button>
    </form>
  );
}

function buildSuggestedAmounts(sponsorshipAmount?: number): number[] {
  const base = sponsorshipAmount && sponsorshipAmount > 0 ? Math.round(sponsorshipAmount * 100) : 2500;
  const amounts = [base, base * 2, base * 4, base * 10].filter((v, i, arr) => v >= 100 && arr.indexOf(v) === i);
  return amounts.length ? amounts : [2500, 5000, 10000, 25000];
}

export { buildSuggestedAmounts };

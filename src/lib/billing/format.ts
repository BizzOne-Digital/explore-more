import type { IPaymentMethodSnapshot } from "@/models/Billing";

const BRAND_LABELS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
  diners: "Diners Club",
  jcb: "JCB",
  unionpay: "UnionPay",
  unknown: "Card",
};

export function formatCardBrand(brand: string): string {
  return BRAND_LABELS[brand.toLowerCase()] ?? brand.charAt(0).toUpperCase() + brand.slice(1);
}

export function formatPaymentMethod(pm: IPaymentMethodSnapshot | null): string {
  if (!pm?.last4) return "No payment method on file";
  const brand = formatCardBrand(pm.brand || "unknown");
  return `${brand} •••• ${pm.last4}`;
}

export function formatInterval(interval: "month" | "year"): string {
  return interval === "year" ? "Annual" : "Monthly";
}

export function formatSubscriptionStatus(status: string): string {
  const labels: Record<string, string> = {
    active: "Active",
    trialing: "Trial",
    past_due: "Past due (payment failed)",
    canceled: "Canceled",
    paused: "Paused",
    none: "Free Account",
    unpaid: "Unpaid",
    incomplete: "Incomplete",
    incomplete_expired: "Incomplete (expired)",
    no_stripe_subscription: "No Stripe subscription",
  };
  return labels[status] ?? status;
}

export function subscriptionStatusBadgeClass(status: string): string {
  switch (status) {
    case "active":
    case "trialing":
      return "bg-green-500/15 text-green-300 border-green-500/30";
    case "past_due":
    case "unpaid":
    case "incomplete":
      return "bg-red-500/15 text-red-300 border-red-500/30";
    case "paused":
      return "bg-amber-500/15 text-amber-200 border-amber-500/30";
    case "canceled":
    case "incomplete_expired":
      return "bg-white/10 text-white/60 border-white/20";
    default:
      return "bg-white/10 text-white/70 border-white/20";
  }
}

export function subscriptionStatusBadgeClassLight(status: string): string {
  switch (status) {
    case "active":
    case "trialing":
      return "bg-green-100 text-green-800";
    case "past_due":
    case "unpaid":
    case "incomplete":
      return "bg-red-100 text-red-800";
    case "paused":
      return "bg-amber-100 text-amber-900";
    case "canceled":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export function formatInvoiceStatus(status: string | null | undefined): string {
  if (!status) return "—";
  const labels: Record<string, string> = {
    paid: "Paid",
    open: "Open (not paid)",
    draft: "Draft",
    uncollectible: "Uncollectible",
    void: "Void",
  };
  return labels[status] ?? status;
}

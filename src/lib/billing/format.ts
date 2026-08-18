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
    past_due: "Past Due",
    canceled: "Canceled",
    paused: "Paused",
    none: "No Subscription",
  };
  return labels[status] ?? status;
}

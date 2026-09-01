import { COMPANY } from "@/lib/constants";

const PRODUCTION_CANONICAL_URL = "https://exploremoreacademy.com";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

/** Canonical app URL for emails, Stripe, metadata, etc. */
export function getAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL;
  if (explicit) {
    const normalized = normalizeBaseUrl(explicit);
    if (process.env.VERCEL_ENV === "production" && normalized.includes("vercel.app")) {
      return PRODUCTION_CANONICAL_URL;
    }
    return normalized;
  }

  if (process.env.VERCEL_ENV === "production") {
    return PRODUCTION_CANONICAL_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return normalizeBaseUrl(COMPANY.website) || "http://localhost:3000";
}

/** Build an absolute URL from an origin and path. */
export function absoluteUrl(origin: string, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizeBaseUrl(origin)}${normalizedPath}`;
}

/** Prefer the host the user is actually visiting (custom domain vs preview URL). */
export async function getRequestOrigin(): Promise<string> {
  const { headers } = await import("next/headers");
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    headerList.get("host")?.split(",")[0]?.trim();

  if (!host) return getAppUrl();

  const forwardedProto = headerList.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol =
    forwardedProto ??
    (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return `${protocol}://${host}`;
}

/** Client-side sign-out redirect that stays on the current domain. */
export function getClientSignOutUrl(path: string): string {
  if (typeof window !== "undefined") {
    return absoluteUrl(window.location.origin, path);
  }

  return absoluteUrl(getAppUrl(), path);
}

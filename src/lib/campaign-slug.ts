import type { FlattenMaps, Model, Types } from "mongoose";
import type { IDonationCampaign } from "@/models/Donation";
import { safeSlug } from "@/lib/utils";

export type DonationCampaignLean = FlattenMaps<IDonationCampaign> & {
  _id: Types.ObjectId;
};

/** URL-safe slug used in `/donate/[slug]` links. */
export function publicCampaignSlug(storedSlug: string): string {
  return safeSlug(storedSlug);
}

export function decodeCampaignSlugParam(slugParam: string): string {
  try {
    return decodeURIComponent(slugParam);
  } catch {
    return slugParam;
  }
}

/** Find a published campaign by path segment (handles legacy slugs with spaces/casing). */
export async function findPublishedCampaignBySlugParam(
  DonationCampaign: Model<IDonationCampaign>,
  slugParam: string
): Promise<DonationCampaignLean | null> {
  const decoded = decodeCampaignSlugParam(slugParam).trim();
  const normalized = safeSlug(decoded);

  const exact = await DonationCampaign.findOne({
    slug: decoded,
    status: "published",
  }).lean();
  if (exact) return exact as DonationCampaignLean;

  if (normalized) {
    const byNormalized = await DonationCampaign.findOne({
      slug: normalized,
      status: "published",
    }).lean();
    if (byNormalized) return byNormalized as DonationCampaignLean;
  }

  const published = await DonationCampaign.find({ status: "published" }).lean();
  const match = published.find((c) => safeSlug(c.slug) === normalized);
  return match ? (match as DonationCampaignLean) : null;
}

export function sanitizeCampaignSlug(slug: unknown): string | undefined {
  if (typeof slug !== "string" || !slug.trim()) return undefined;
  return safeSlug(slug);
}

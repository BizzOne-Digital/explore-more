import { getCampaignGoalCents, getCampaignRaisedCents } from "@/lib/pricing";
import { dollarsToCents } from "@/lib/utils";
import type { PublicCampaign } from "@/types/public";

export function mapPublicCampaign(raw: Record<string, unknown>): PublicCampaign {
  const goalAmount = Number(raw.goalAmount ?? 0);
  const raisedAmount = Number(raw.raisedAmount ?? 0);

  return {
    _id: String(raw._id),
    slug: String(raw.slug),
    title: String(raw.title),
    description: String(raw.description ?? ""),
    coverImage: raw.coverImage as string | undefined,
    goalCents: getCampaignGoalCents({ goalAmount }),
    raisedCents: getCampaignRaisedCents({ raisedAmount }),
    suggestedAmounts: Array.isArray(raw.suggestedAmounts)
      ? (raw.suggestedAmounts as number[]).map((amount) => dollarsToCents(amount))
      : undefined,
    customAmountEnabled: raw.customAmountEnabled !== false,
    allowAnonymous: raw.allowAnonymous !== false,
    metaTitle: raw.metaTitle as string | undefined,
    metaDescription: raw.metaDescription as string | undefined,
  };
}

export function mapPublicCampaigns(items: Record<string, unknown>[]): PublicCampaign[] {
  return items.map(mapPublicCampaign);
}

export function getCampaignProgressPercent(goalCents: number, raisedCents: number): number {
  if (!Number.isFinite(goalCents) || goalCents <= 0) return 0;
  const raised = Number.isFinite(raisedCents) ? raisedCents : 0;
  return Math.min(100, Math.round((raised / goalCents) * 100));
}

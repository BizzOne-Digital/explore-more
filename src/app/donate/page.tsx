import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedCampaigns } from "@/lib/queries/public";
import { PageHero } from "@/components/ui/PageHero";
import { formatCents } from "@/lib/utils";
import { getCampaignProgressPercent } from "@/lib/content/public-campaign";

export const metadata: Metadata = {
  title: "Donate",
  description: "Support Explore More Academy programs and sponsorship campaigns.",
};

export const dynamic = "force-dynamic";

export default async function DonateIndexPage() {
  const campaigns = await getPublishedCampaigns().catch(() => []);

  return (
    <div>
      <PageHero
        title="Donate"
        subtitle="Choose a campaign below to make a gift. Every contribution helps young explorers learn wild and live big."
      />

      <section className="bg-explore-cream py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {campaigns.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              <p className="text-explore-charcoal/70">
                No active donation campaigns right now.
              </p>
              <Link
                href="/sponsor-a-kid"
                className="mt-6 inline-block rounded-full bg-explore-teal px-6 py-3 text-sm font-semibold text-white hover:bg-explore-teal/90"
              >
                Become a sponsor
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {campaigns.map((campaign) => {
                const progress = getCampaignProgressPercent(
                  campaign.goalCents,
                  campaign.raisedCents
                );
                return (
                  <li key={String(campaign._id)}>
                    <Link
                      href={`/donate/${campaign.slug}`}
                      className="block rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
                    >
                      <h2 className="font-display text-xl font-semibold text-explore-charcoal">
                        {campaign.title}
                      </h2>
                      {campaign.description ? (
                        <p className="mt-2 line-clamp-2 text-sm text-explore-charcoal/70">
                          {campaign.description}
                        </p>
                      ) : null}
                      <p className="mt-3 text-sm font-medium text-explore-teal">
                        {formatCents(campaign.raisedCents)} raised
                        {campaign.goalCents > 0
                          ? ` · ${Math.round(progress)}% of goal`
                          : ""}
                      </p>
                      <span className="mt-4 inline-block text-sm font-semibold text-explore-orange">
                        Donate to this campaign →
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

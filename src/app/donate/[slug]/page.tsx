import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getCampaignBySlug } from "@/lib/queries/public";
import { formatCents } from "@/lib/utils";
import { getCampaignProgressPercent } from "@/lib/content/public-campaign";
import { DonationForm } from "@/components/forms/DonationForm";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) return { title: "Campaign Not Found" };
  return {
    title: campaign.metaTitle || campaign.title,
    description: campaign.metaDescription || campaign.description,
  };
}

export default async function DonatePage({ params }: Props) {
  const { slug } = await params;
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) notFound();

  const progress = getCampaignProgressPercent(campaign.goalCents, campaign.raisedCents);
  const cover =
    campaign.coverImage ||
    "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1200&q=80";

  return (
    <>
      <section className="relative w-full overflow-x-clip bg-explore-charcoal text-white pt-28 pb-12">
        <div className="absolute inset-0">
          <Image src={cover} alt="" fill className="object-cover opacity-30" sizes="100vw" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-explore-charcoal to-explore-charcoal/70" />
        </div>
        <div className="relative mx-auto w-full min-w-0 max-w-4xl px-3 sm:px-4">
          <h1 className="break-anywhere font-display text-3xl font-bold sm:text-4xl lg:text-5xl">{campaign.title}</h1>
          <p className="mt-4 text-lg text-white/80">{campaign.description}</p>
          <div className="mt-6 max-w-md">
            <div className="h-3 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full bg-explore-lime rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-sm text-white/60">
              {formatCents(campaign.raisedCents)} raised · {progress}% of {formatCents(campaign.goalCents)} goal
            </p>
          </div>
        </div>
      </section>

      <section className="w-full overflow-x-clip py-16 bg-explore-cream">
        <div className="mx-auto w-full min-w-0 max-w-lg px-3 sm:px-4">
          <div className="rounded-2xl border border-explore-charcoal/10 bg-white p-4 shadow-sm sm:p-8">
            <h2 className="font-display text-2xl font-bold mb-6">Make a Donation</h2>
            <DonationForm
              campaignId={campaign._id}
              campaignSlug={campaign.slug}
              campaignTitle={campaign.title}
              suggestedAmounts={campaign.suggestedAmounts?.length ? campaign.suggestedAmounts : [2500, 5000, 10000, 25000]}
              customAmountEnabled={campaign.customAmountEnabled}
              allowAnonymous={campaign.allowAnonymous}
            />
          </div>
        </div>
      </section>
    </>
  );
}

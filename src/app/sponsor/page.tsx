import { Metadata } from "next";
import Link from "next/link";
import connectDB from "@/lib/db";
import { DonationCampaign, Donation } from "@/models";
import { PageHero } from "@/components/ui/PageHero";
import { formatCurrency } from "@/lib/utils";
import { getCampaignGoalCents, getCampaignRaisedCents } from "@/lib/pricing";
import { formatDistanceToNow } from "date-fns";

export const metadata: Metadata = {
  title: "Sponsor & Donate",
  description: "Support our programs and make a lasting impact on children's lives.",
};

export const dynamic = "force-dynamic";

async function getFeaturedCampaigns() {
  await connectDB();
  return await DonationCampaign.find({
    status: "published",
    featured: true,
  })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();
}

async function getRecentDonations() {
  await connectDB();
  return (await Donation.find({
    paymentStatus: "paid",
    isAnonymous: false,
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("campaignId", "title")
    .lean()) as Array<{
    _id: { toString(): string };
    donorName: string;
    amountCents: number;
    createdAt: Date;
    campaignId?: { title?: string } | null;
  }>;
}

export default async function SponsorPage() {
  const [campaigns, recentDonations] = await Promise.all([
    getFeaturedCampaigns(),
    getRecentDonations(),
  ]);

  return (
    <div>
      <PageHero
        title="Sponsor a Kid"
        subtitle="Make a lasting impact on a child's life. Your sponsorship provides essential resources, education, and opportunities."
      />

      <section className="bg-explore-cream py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Campaign Cards Grid */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => {
              const goalCents = getCampaignGoalCents(campaign);
              const raisedCents = getCampaignRaisedCents(campaign);
              const progress = goalCents > 0 
                ? Math.min((raisedCents / goalCents) * 100, 100)
                : 0;

              return (
                <div
                  key={campaign._id.toString()}
                  className="group overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1"
                >
                  {/* Campaign Image */}
                  {campaign.coverImage && (
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={campaign.coverImage}
                        alt={campaign.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  )}

                  {/* Campaign Info */}
                  <div className="p-6">
                    <h3 className="font-display text-xl font-semibold text-explore-charcoal mb-3">
                      {campaign.title}
                    </h3>
                    
                    <p className="text-sm text-explore-charcoal/70 mb-4 line-clamp-2">
                      {campaign.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold text-explore-charcoal">
                          {formatCurrency(raisedCents)}
                        </span>
                        <span className="text-explore-charcoal/60">
                          of {formatCurrency(goalCents)} goal
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-explore-teal transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Donate Button */}
                    <Link
                      href={`/donate/${campaign.slug}`}
                      className="block w-full rounded-full bg-explore-teal px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-explore-teal/90"
                    >
                      Donate Now
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* If no campaigns */}
          {campaigns.length === 0 && (
            <div className="text-center py-16">
              <p className="text-explore-charcoal/60">
                No active campaigns at the moment. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Donations Section */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-3xl font-bold text-explore-charcoal">
              Recent Donations
            </h2>
            <Link
              href="/donate"
              className="rounded-full bg-explore-orange px-6 py-2 text-sm font-semibold text-white hover:bg-explore-orange/90 transition-colors"
            >
              Donate
            </Link>
          </div>

          <div className="space-y-4">
            {recentDonations.map((donation) => (
              <div
                key={donation._id.toString()}
                className="flex items-center gap-4 rounded-xl bg-explore-cream p-4 transition-colors hover:bg-explore-sand"
              >
                {/* Avatar */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-explore-teal/20">
                  <span className="text-lg font-semibold text-explore-teal">
                    {donation.donorName.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Donor Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-explore-charcoal">
                    {donation.donorName}
                  </p>
                  <p className="text-sm text-explore-charcoal/60">
                    donated{" "}
                    <span className="font-semibold text-explore-teal">
                      {formatCurrency(donation.amountCents)}
                    </span>
                    {donation.campaignId && (
                      <>
                        {" "}to{" "}
                        <span className="font-medium">
                          {donation.campaignId?.title}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                {/* Time */}
                <div className="text-right">
                  <p className="text-xs text-explore-charcoal/50">
                    {formatDistanceToNow(new Date(donation.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* If no donations */}
          {recentDonations.length === 0 && (
            <div className="text-center py-12 text-explore-charcoal/60">
              <p>No donations yet. Be the first to support our cause!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

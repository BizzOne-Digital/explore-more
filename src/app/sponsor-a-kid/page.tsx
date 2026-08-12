import type { Metadata } from "next";
import Image from "next/image";
import { Heart, Users, Gift } from "lucide-react";
import { COMPANY } from "@/lib/constants";
import { HERO_IMAGES } from "@/lib/content/home";
import { getPublishedCampaigns } from "@/lib/queries/public";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { formatCents } from "@/lib/utils";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Sponsor a Kid",
  description: "Help a young explorer access outdoor education through Explore More Academy.",
};

export default async function SponsorAKidPage() {
  const campaigns = await getPublishedCampaigns().catch(() => [] as Awaited<ReturnType<typeof getPublishedCampaigns>>);

  return (
    <>
      <PageHero
        title="Sponsor a Kid"
        subtitle="Every child deserves the chance to explore. Your gift removes barriers and opens trails."
        eyebrow="Give Back"
        image={HERO_IMAGES.sponsor}
        size="large"
        align="center"
      >
        <Button href="#campaigns" variant="primary">View Campaigns</Button>
      </PageHero>

      <section className="w-full overflow-x-clip py-20 bg-explore-cream">
        <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4">
          <SectionHeading
            eyebrow="Impact"
            title="Why Sponsor?"
            description="Your donation directly funds scholarships, gear, transportation, and program fees for youth who would otherwise miss out."
            align="center"
            className="mb-12 mx-auto"
          />
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: Heart, title: "Direct Impact", desc: "100% of designated donations go toward youth program access and scholarships." },
              { icon: Users, title: "Community", desc: "Join a growing network of families and partners investing in the next generation." },
              { icon: Gift, title: "Flexible Giving", desc: "Choose a campaign, pick an amount, or set up a recurring gift that fits your budget." },
            ].map((item) => (
              <div key={item.title} className="text-center p-8 rounded-2xl bg-white border border-explore-charcoal/8 shadow-sm">
                <item.icon className="h-10 w-10 mx-auto text-explore-orange" />
                <h3 className="mt-4 font-display text-xl font-bold">{item.title}</h3>
                <p className="mt-2 text-sm text-explore-charcoal/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="campaigns" className="w-full overflow-x-clip py-20 bg-white">
        <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4">
          <SectionHeading eyebrow="Campaigns" title="Active Campaigns" className="mb-10" />
          {campaigns.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => {
                const progress = Math.min(100, Math.round((campaign.raisedCents / campaign.goalCents) * 100));
                return (
                  <Card key={String(campaign._id)} href={`/donate/${campaign.slug}`}>
                    {campaign.coverImage && (
                      <div className="relative aspect-video bg-explore-sand">
                        <Image src={campaign.coverImage} alt="" fill className="object-cover" sizes="400px" />
                      </div>
                    )}
                    <CardBody>
                      <CardTitle>{campaign.title}</CardTitle>
                      <p className="mt-2 text-sm text-explore-charcoal/70 line-clamp-2">{campaign.description}</p>
                      <div className="mt-4">
                        <div className="h-2 rounded-full bg-explore-charcoal/10 overflow-hidden">
                          <div className="h-full bg-explore-teal rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="mt-2 text-xs text-explore-charcoal/50">
                          {formatCents(campaign.raisedCents)} raised of {formatCents(campaign.goalCents)} goal
                        </p>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-explore-sand/50 border border-explore-charcoal/10 p-12 text-center">
              <p className="font-display text-xl font-bold text-explore-charcoal">General Sponsorship Fund</p>
              <p className="mt-2 text-sm text-explore-charcoal/70 max-w-md mx-auto">
                Campaigns are being set up. In the meantime, contact us to make a direct sponsorship gift.
              </p>
              <Button href="/contact" variant="secondary" className="mt-6">Contact {COMPANY.name}</Button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

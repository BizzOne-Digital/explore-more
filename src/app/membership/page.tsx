import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { MembershipPlans } from "@/components/membership/MembershipPlans";

export const metadata: Metadata = {
  title: "Membership",
  description:
    "Explore More Academy homeschool memberships — from Explorer to Legacy. Monthly and annual plans with member benefits, resources, and support.",
};

export default function MembershipPage() {
  return (
    <>
      <PageHero
        title="Homeschool Memberships"
        subtitle="Choose the plan that fits your family's adventure. Switch between monthly and annual billing to see your savings."
        eyebrow="Join Us"
        align="center"
      />
      <section className="w-full overflow-x-clip bg-explore-cream py-16">
        <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4">
          <MembershipPlans />
          <p className="mt-10 text-center text-sm text-explore-charcoal/60">
            After checkout, you&apos;ll be guided to create your parent account and access your
            member dashboard.
          </p>
        </div>
      </section>
    </>
  );
}

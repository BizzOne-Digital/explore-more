import type { Metadata } from "next";
import { COMPANY } from "@/lib/constants";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of service for ${COMPANY.name}.`,
};

export default function TermsPage() {
  return (
    <>
      <PageHero title="Terms of Service" subtitle={`Last updated: ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`} />
      <section className="w-full overflow-x-clip py-16 bg-explore-cream">
        <div className="mx-auto w-full min-w-0 max-w-3xl px-3 sm:px-4 prose prose-sm text-explore-charcoal/80 space-y-6">
          <p>
            By accessing or using the {COMPANY.name} website and services, you agree to these Terms of Service.
            Please read them carefully.
          </p>
          <h2 className="font-display text-xl font-bold text-explore-charcoal">Use of Services</h2>
          <p>
            Our platform provides information about outdoor education programs, events, courses, and a bookstore.
            You must provide accurate information when creating an account or registering for programs.
          </p>
          <h2 className="font-display text-xl font-bold text-explore-charcoal">Program Participation</h2>
          <p>
            Participation in outdoor programs involves inherent risks. Parents and guardians must complete required
            consent forms and ensure participants follow safety guidelines provided by instructors.
          </p>
          <h2 className="font-display text-xl font-bold text-explore-charcoal">Payments & Refunds</h2>
          <p>
            Paid events, courses, and bookstore purchases are processed securely. Refund eligibility varies by
            program type and is subject to our cancellation policy. Contact us at least 7 days before an event
            for cancellation requests.
          </p>
          <h2 className="font-display text-xl font-bold text-explore-charcoal">Account Responsibilities</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for all activity
            under your account. Notify us immediately of any unauthorized use.
          </p>
          <h2 className="font-display text-xl font-bold text-explore-charcoal">Intellectual Property</h2>
          <p>
            All content on this website — including text, images, logos, and curriculum materials — is owned by
            {COMPANY.name} unless otherwise noted. Unauthorized reproduction is prohibited.
          </p>
          <h2 className="font-display text-xl font-bold text-explore-charcoal">Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, {COMPANY.name} shall not be liable for indirect, incidental,
            or consequential damages arising from use of our services.
          </p>
          <h2 className="font-display text-xl font-bold text-explore-charcoal">Contact</h2>
          <p>
            Questions about these terms? Contact us at{" "}
            <a href={`mailto:${COMPANY.email}`} className="text-explore-teal hover:underline">{COMPANY.email}</a>.
          </p>
        </div>
      </section>
    </>
  );
}

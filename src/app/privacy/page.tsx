import type { Metadata } from "next";
import { COMPANY } from "@/lib/constants";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy policy for ${COMPANY.name}.`,
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero title="Privacy Policy" subtitle={`Last updated: ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`} />
      <section className="w-full overflow-x-clip py-16 bg-explore-cream">
        <div className="mx-auto w-full min-w-0 max-w-3xl px-3 sm:px-4 prose prose-sm text-explore-charcoal/80 space-y-6">
          <p>
            {COMPANY.name} (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) respects your privacy. This policy describes how we collect,
            use, and protect personal information when you use our website and services.
          </p>
          <h2 className="font-display text-xl font-bold text-explore-charcoal">Information We Collect</h2>
          <p>
            We collect information you provide directly — such as name, email, phone number, and payment details when
            you register, enroll, purchase books, or make donations. We also collect usage data through standard
            analytics to improve our services.
          </p>
          <h2 className="font-display text-xl font-bold text-explore-charcoal">How We Use Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Process registrations, enrollments, orders, and donations</li>
            <li>Communicate about programs, events, and account activity</li>
            <li>Improve our website and educational offerings</li>
            <li>Comply with legal obligations</li>
          </ul>
          <h2 className="font-display text-xl font-bold text-explore-charcoal">Children&apos;s Privacy</h2>
          <p>
            Our services involve youth participants. Parent or guardian accounts are required for students under 13.
            We do not knowingly collect personal information from children without parental consent.
          </p>
          <h2 className="font-display text-xl font-bold text-explore-charcoal">Data Security</h2>
          <p>
            We implement industry-standard security measures including encrypted connections and secure payment processing
            through Stripe. Passwords are hashed and never stored in plain text.
          </p>
          <h2 className="font-display text-xl font-bold text-explore-charcoal">Your Rights</h2>
          <p>
            You may request access to, correction of, or deletion of your personal data by contacting us at{" "}
            <a href={`mailto:${COMPANY.email}`} className="text-explore-teal hover:underline">{COMPANY.email}</a>.
          </p>
          <h2 className="font-display text-xl font-bold text-explore-charcoal">Contact</h2>
          <p>
            Questions about this policy? Email{" "}
            <a href={`mailto:${COMPANY.email}`} className="text-explore-teal hover:underline">{COMPANY.email}</a> or
            call {COMPANY.phone}.
          </p>
        </div>
      </section>
    </>
  );
}

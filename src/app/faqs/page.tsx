import type { Metadata } from "next";
import { getAllFAQs } from "@/lib/queries/public";
import { createSectionChecker, getPageSectionVisibility } from "@/lib/queries/pages";
import { PageHero } from "@/components/ui/PageHero";
import { FAQAccordion } from "@/components/cards/FAQAccordion";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Frequently asked questions about Explore More Academy programs, events, and enrollment.",
};

const FALLBACK_FAQS = [
  { question: "What ages do you serve?", answer: "Our programs typically serve youth ages 6–18. Each program and event lists a specific age range." },
  { question: "Are programs homeschool-friendly?", answer: "Yes! Many programs are designed with flexible schedules and curriculum connections for homeschool families." },
  { question: "How do I register for an event?", answer: "Create an account, browse upcoming events, and complete registration. Paid events process through secure checkout." },
  { question: "Can I request a custom program?", answer: "Absolutely. Visit any program page and submit a service request. We respond within 2 business days." },
  { question: "What should my child bring?", answer: "Each event and program lists specific items. Generally: water, snacks, sun protection, and closed-toe shoes." },
  { question: "Do you offer scholarships?", answer: "Yes, through our Become a Sponsor program. Donations fund scholarships for families who need financial assistance." },
  { question: "Is parental supervision required?", answer: "Some events require a parent/guardian. This is noted on each event page during registration." },
  { question: "What is your refund policy?", answer: "Refund policies vary by program type. Contact us at least 7 days before an event for cancellation requests." },
];

export default async function FAQsPage() {
  const show = createSectionChecker(await getPageSectionVisibility("faqs"));
  const faqs = await getAllFAQs().catch(() => [] as Awaited<ReturnType<typeof getAllFAQs>>);
  const items = faqs.length > 0 ? faqs : FALLBACK_FAQS;

  return (
    <>
      {show("hero") && (
        <PageHero
          title="Frequently Asked Questions"
          subtitle="Everything you need to know before your adventure begins."
          eyebrow="Help"
        />
      )}
      {(show("faq-list") || show("contact-cta")) && (
        <section className="w-full overflow-x-clip py-16 bg-explore-cream min-h-[50vh]">
          <div className="mx-auto w-full min-w-0 max-w-3xl px-3 sm:px-4">
            {show("faq-list") && <FAQAccordion items={items} />}
            {show("contact-cta") && (
              <div className={`rounded-2xl bg-explore-teal/10 border border-explore-teal/20 p-8 text-center ${show("faq-list") ? "mt-12" : ""}`}>
                <p className="font-display text-xl font-bold text-explore-charcoal">Still have questions?</p>
                <p className="mt-2 text-sm text-explore-charcoal/70">Our team is happy to help.</p>
                <Button href="/contact" variant="secondary" className="mt-4">Contact Us</Button>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}

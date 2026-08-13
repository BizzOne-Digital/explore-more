import type { Metadata } from "next";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { COMPANY } from "@/lib/constants";
import { HERO_IMAGES } from "@/lib/content/home";
import { createSectionChecker, getPageSectionVisibility } from "@/lib/queries/pages";
import { PageHero } from "@/components/ui/PageHero";
import { ContactForm } from "@/components/forms/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${COMPANY.name}.`,
};

export default async function ContactPage() {
  const show = createSectionChecker(await getPageSectionVisibility("contact"));
  const showInfo = show("contact-info");
  const showForm = show("contact-form");

  return (
    <>
      {show("hero") && (
        <PageHero
          title="Contact Us"
          subtitle="Questions about programs, events, or partnerships? We'd love to hear from you."
          eyebrow="Get in Touch"
          image={HERO_IMAGES.contact}
          align="center"
        />
      )}
      {(showInfo || showForm) && (
        <section className="w-full overflow-x-clip py-16 bg-explore-cream">
          <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4 grid gap-12 lg:grid-cols-5">
            {showInfo && (
              <div className="lg:col-span-2 space-y-8">
                <div>
                  <h2 className="font-display text-2xl font-bold mb-6">Reach Out</h2>
                  <ul className="space-y-5">
                    <li className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-explore-teal shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-explore-charcoal">Email</p>
                        <a href={`mailto:${COMPANY.email}`} className="text-sm text-explore-teal hover:underline">
                          {COMPANY.email}
                        </a>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-explore-teal shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-explore-charcoal">Phone</p>
                        <a href={`tel:${COMPANY.phone.replace(/\D/g, "")}`} className="text-sm text-explore-teal hover:underline">
                          {COMPANY.phone}
                        </a>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-explore-teal shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-explore-charcoal">Location</p>
                        <p className="text-sm text-explore-charcoal/60">Address pending verification</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-explore-teal shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-explore-charcoal">Response Time</p>
                        <p className="text-sm text-explore-charcoal/60">Within 2 business days</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            )}
            {showForm && (
              <div className={showInfo ? "lg:col-span-3" : "lg:col-span-5 max-w-3xl mx-auto w-full"}>
                <div className="rounded-2xl bg-white border border-explore-charcoal/10 p-8 shadow-sm">
                  <h2 className="font-display text-2xl font-bold mb-6">Send a Message</h2>
                  <ContactForm />
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}

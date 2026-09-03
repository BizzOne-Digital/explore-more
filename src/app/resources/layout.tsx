import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { ResourceToolNav } from "@/components/resources/ResourceToolNav";

export const metadata: Metadata = {
  title: "Free Homeschool Tools",
  description:
    "Free homeschool transcript and certificate generators from Explore More Academy. Download PDFs — no account needed.",
};

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHero
        title="Free Homeschool Tools"
        subtitle="Fill in your student's info and download professional PDFs — free, no account needed."
        eyebrow="Resources"
      />
      <section className="w-full overflow-x-clip bg-explore-cream py-10 sm:py-14">
        <div className="mx-auto w-full min-w-0 max-w-5xl px-3 sm:px-4">
          <div className="mb-8 flex justify-center">
            <ResourceToolNav />
          </div>
          {children}
        </div>
      </section>
    </>
  );
}

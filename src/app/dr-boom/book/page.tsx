import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DrBoomExperience } from "@/components/dr-boom/DrBoomExperience";
import { isPageNavVisible } from "@/lib/queries/navigation";

export const metadata: Metadata = {
  title: "Book Dr. Boom | Explore More Academy",
  description:
    "Book Dr. Boom — Chief of Wacky Discoveries. Choose a package and send your booking request for schools, libraries, camps, and festivals.",
  openGraph: {
    title: "Book Dr. Boom Science",
    description: "Official Dr. Boom Booking Lab — packages from 15 minutes to custom events.",
    images: ["/images/dr-boom/logo.png"],
  },
};

export default async function DrBoomBookPage() {
  if (!(await isPageNavVisible("dr-boom"))) notFound();
  return <DrBoomExperience />;
}

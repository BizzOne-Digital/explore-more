import type { Metadata } from "next";
import { DrBoomExperience } from "@/components/dr-boom/DrBoomExperience";

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

export default function DrBoomBookPage() {
  return <DrBoomExperience />;
}

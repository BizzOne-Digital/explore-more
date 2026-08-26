import type { Metadata } from "next";
import { DrBoomShowExperience } from "@/components/dr-boom/DrBoomShowExperience";

export const metadata: Metadata = {
  title: "Dr. Boom Science | Explore More Academy",
  description:
    "Meet Dr. Boom — Chief of Wacky Discoveries! Wild science shows for schools, libraries, camps, and community events.",
  openGraph: {
    title: "Dr. Boom Science Spectacular",
    description:
      "A 45–60 minute interactive STEM experience with bubbling reactions, audience participation, and unforgettable discoveries.",
    images: ["/images/dr-boom/logo.png"],
  },
};

export default function DrBoomPage() {
  return <DrBoomShowExperience />;
}

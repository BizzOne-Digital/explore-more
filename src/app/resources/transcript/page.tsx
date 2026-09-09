import type { Metadata } from "next";
import { TranscriptGeneratorForm } from "@/components/resources/TranscriptGeneratorForm";

export const metadata: Metadata = {
  title: "Homeschool Transcript & Report Card Generator",
  description:
    "Create a homeschool transcript or report card PDF with courses, grades, credits, and GPA. Free tool from Explore More Academy.",
};

export default function TranscriptGeneratorPage() {
  return <TranscriptGeneratorForm />;
}

import type { Metadata } from "next";
import { CertificateGeneratorForm } from "@/components/resources/CertificateGeneratorForm";

export const metadata: Metadata = {
  title: "Certificate of Completion Generator",
  description:
    "Create a printable homeschool certificate of completion PDF. Free tool from Explore More Academy.",
};

export default function CertificateGeneratorPage() {
  return <CertificateGeneratorForm />;
}

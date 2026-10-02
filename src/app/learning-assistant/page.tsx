import type { Metadata } from "next";
import { LearningAssistantPage } from "@/components/chat/LearningAssistantPage";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Learning Assistant",
  description: `Ask ${COMPANY.name}'s educational assistant about homework, study skills, and learning topics.`,
  robots: { index: true, follow: true },
};

export default function LearningAssistantRoute() {
  return <LearningAssistantPage />;
}

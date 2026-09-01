import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PortalEntryPage } from "@/components/forms/PortalEntryPage";
import { getPortalAccessForUser } from "@/lib/membership/portal-access";

export const metadata: Metadata = {
  title: "Student Portal",
  description: "Create your student account or sign in to the Explore More Academy student portal.",
};

export default async function StudentPortalEntryPage() {
  const session = await auth();
  if (session?.user?.role === "student") {
    const access = await getPortalAccessForUser(session.user.id, session.user.role, "student");
    if (access.hasAccess && access.redirectUrl) {
      redirect(access.redirectUrl);
    }
  }

  return <PortalEntryPage portal="student" />;
}

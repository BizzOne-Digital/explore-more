import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PortalEntryPage } from "@/components/forms/PortalEntryPage";
import { getPortalAccessForUser } from "@/lib/membership/portal-access";

export const metadata: Metadata = {
  title: "Parent Portal",
  description: "Create your parent account or sign in to the Explore More Academy parent portal.",
};

export default async function ParentPortalEntryPage() {
  const session = await auth();
  if (session?.user) {
    const access = await getPortalAccessForUser(session.user.id, session.user.role, "parent");
    if (access.hasAccess && access.redirectUrl) {
      redirect(access.redirectUrl);
    }
  }

  return <PortalEntryPage portal="parent" />;
}

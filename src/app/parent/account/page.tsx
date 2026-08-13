import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import { User } from "@/models";

export default async function ParentAccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/parent/account");

  await connectDB();
  const user = await User.findById(session.user.id).select("name email phone notificationPreferences");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Account</h2>
        <p className="mt-1 text-sm text-explore-charcoal/70">Your parent account information and preferences.</p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase text-explore-charcoal/50">Name</p>
          <p className="font-medium">{user?.name ?? session.user.name}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-explore-charcoal/50">Email</p>
          <p className="font-medium">{user?.email ?? session.user.email}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-explore-charcoal/50">Phone</p>
          <p className="font-medium">{user?.phone ?? "Not set"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-explore-charcoal/50">Notification Preferences</p>
          <ul className="mt-2 text-sm space-y-1 text-explore-charcoal/70">
            <li>Events: {user?.notificationPreferences?.events ? "On" : "Off"}</li>
            <li>Courses: {user?.notificationPreferences?.courses ? "On" : "Off"}</li>
            <li>Announcements: {user?.notificationPreferences?.announcements ? "On" : "Off"}</li>
          </ul>
        </div>
        <p className="text-sm text-explore-charcoal/60 pt-2 border-t">
          Contact the academy to update account details or link additional students.
        </p>
      </div>
    </div>
  );
}

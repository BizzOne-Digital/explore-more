import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { User, StudentProfile } from "@/models";

export default async function StudentProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/student/profile");

  await connectDB();

  const [user, profile] = await Promise.all([
    User.findById(session.user.id),
    StudentProfile.findOne({ userId: session.user.id }),
  ]);

  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-explore-charcoal">My Profile</h2>
        <p className="mt-1 text-explore-charcoal/70">Manage your account information.</p>
      </div>

      <div className="rounded-2xl bg-explore-white p-6 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-2">
          <ProfileField label="Name" value={user.name} />
          <ProfileField label="Email" value={user.email} />
          <ProfileField
            label="Email Verified"
            value={user.emailVerified ? "Yes" : "No — check your inbox"}
          />
          <ProfileField label="Phone" value={user.phone ?? "Not set"} />
          {user.studentId && (
            <ProfileField label="Student ID" value={user.studentId} />
          )}
          <ProfileField label="Role" value={user.role} />
          {profile?.ageRange && <ProfileField label="Age Range" value={profile.ageRange} />}
          {profile?.schoolStatus && (
            <ProfileField label="School Status" value={profile.schoolStatus} />
          )}
          {profile?.bio && (
            <div className="sm:col-span-2">
              <ProfileField label="Bio" value={profile.bio} />
            </div>
          )}
        </dl>
      </div>

      <div className="rounded-2xl bg-explore-white p-6 shadow-sm">
        <h3 className="font-semibold text-explore-charcoal">Notification Preferences</h3>
        <ul className="mt-4 space-y-2 text-sm">
          <PrefItem label="Events" enabled={user.notificationPreferences.events} />
          <PrefItem label="Courses" enabled={user.notificationPreferences.courses} />
          <PrefItem label="Newsletter" enabled={user.notificationPreferences.newsletter} />
          <PrefItem label="Announcements" enabled={user.notificationPreferences.announcements} />
        </ul>
        <p className="mt-4 text-xs text-explore-charcoal/50">
          Contact the academy to update your notification preferences.
        </p>
      </div>

      {profile?.emergencyContact?.name && (
        <div className="rounded-2xl bg-explore-white p-6 shadow-sm">
          <h3 className="font-semibold text-explore-charcoal">Emergency Contact</h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <ProfileField label="Name" value={profile.emergencyContact.name} />
            <ProfileField label="Phone" value={profile.emergencyContact.phone} />
            <ProfileField label="Relationship" value={profile.emergencyContact.relationship} />
          </dl>
        </div>
      )}

      <div className="rounded-2xl border border-explore-sand bg-explore-cream p-5">
        <p className="text-sm text-explore-charcoal/70">
          To update your password, use the{" "}
          <a href="/forgot-password" className="text-explore-teal hover:underline">
            password reset
          </a>{" "}
          flow.
        </p>
      </div>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-explore-charcoal/50">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-explore-charcoal">{value}</dd>
    </div>
  );
}

function PrefItem({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <li className="flex items-center justify-between">
      <span>{label}</span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          enabled ? "bg-explore-lime/30 text-explore-forest" : "bg-explore-sand text-explore-charcoal/50"
        }`}
      >
        {enabled ? "On" : "Off"}
      </span>
    </li>
  );
}

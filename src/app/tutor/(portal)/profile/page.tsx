import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TUTOR_PORTAL_ROLES } from "@/lib/constants";
import { getTutorProfile } from "@/lib/tutor/queries";
import { StaffProfile } from "@/models";

export const dynamic = "force-dynamic";

export default async function TutorProfilePage() {
  const session = await auth();
  if (!session?.user || !TUTOR_PORTAL_ROLES.includes(session.user.role as (typeof TUTOR_PORTAL_ROLES)[number])) {
    redirect("/tutor/login");
  }

  await connectDB();
  const [profile, staffProfile] = await Promise.all([
    getTutorProfile(session.user.id),
    StaffProfile.findOne({ userId: session.user.id }).lean(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">My Profile</h2>
        <p className="mt-1 text-sm text-gray-500">Your Explore More Academy staff account.</p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase text-gray-400">Name</p>
          <p className="font-semibold">{profile?.name}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-gray-400">Email</p>
          <p>{profile?.email}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-gray-400">Staff ID</p>
          <p className="font-mono text-lg font-bold text-violet-700">{profile?.tutorId}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-gray-400">Role</p>
          <p className="capitalize">{profile?.role}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-gray-400">Status</p>
          <p>{profile?.isActive === false ? "Inactive" : "Active"}</p>
        </div>
        {staffProfile?.title && (
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">Title</p>
            <p>{staffProfile.title}</p>
          </div>
        )}
        {staffProfile?.specialties?.length ? (
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">Specialties</p>
            <p>{staffProfile.specialties.join(", ")}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

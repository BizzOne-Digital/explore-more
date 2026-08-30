import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TUTOR_PORTAL_ROLES } from "@/lib/constants";
import { Resource } from "@/models";
import { getTutorAssignedStudentIds } from "@/lib/tutor/permissions";

export const dynamic = "force-dynamic";

export default async function TutorAssignmentsPage() {
  const session = await auth();
  if (!session?.user || !TUTOR_PORTAL_ROLES.includes(session.user.role as (typeof TUTOR_PORTAL_ROLES)[number])) {
    redirect("/tutor/login");
  }

  await connectDB();
  const studentIds = await getTutorAssignedStudentIds(session.user.id);

  const resources =
    studentIds.length > 0
      ? await Resource.find({
          createdBy: session.user.id,
          assignedStudentIds: { $in: studentIds },
        })
          .sort({ createdAt: -1 })
          .lean()
      : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Assignments</h2>
        <p className="mt-1 text-sm text-gray-500">
          Homework, worksheets, and resources you have assigned to students.
        </p>
      </div>

      {resources.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
          No assignments published yet.{" "}
          <a href="/tutor/upload" className="text-violet-600 hover:underline">
            Upload a resource
          </a>
          .
        </div>
      ) : (
        <ul className="space-y-3">
          {resources.map((r) => (
            <li key={r._id.toString()} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="font-semibold">{r.title}</p>
              <p className="text-sm text-gray-500">{r.type}</p>
              {r.description && <p className="mt-2 text-sm text-gray-600">{r.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

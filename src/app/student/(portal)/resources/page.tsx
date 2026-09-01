import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Resource } from "@/models";

export default async function StudentResourcesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/student/resources");

  await connectDB();

  const resources = await Resource.find({
    $or: [{ isPublic: true }, { assignedStudentIds: session.user.id }],
  })
    .populate("courseId", "title")
    .sort({ createdAt: -1 });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-explore-charcoal">Resources</h2>
        <p className="mt-1 text-explore-charcoal/70">
          Worksheets, readings, and materials for your courses.
        </p>
      </div>

      {resources.length === 0 ? (
        <div className="rounded-2xl bg-explore-white p-8 text-center shadow-sm">
          <p className="text-explore-charcoal/60">No resources available yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {resources.map((resource) => {
            const course = resource.courseId as { title?: string } | null;

            return (
              <article
                key={resource._id.toString()}
                className="flex flex-col gap-3 rounded-2xl bg-explore-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-explore-sand px-2 py-0.5 text-xs font-medium uppercase">
                      {resource.type}
                    </span>
                    {course?.title && (
                      <span className="text-xs text-explore-charcoal/50">{course.title}</span>
                    )}
                  </div>
                  <h3 className="mt-2 font-semibold text-explore-charcoal">{resource.title}</h3>
                  {resource.description && (
                    <p className="mt-1 text-sm text-explore-charcoal/60">{resource.description}</p>
                  )}
                </div>
                <div className="shrink-0">
                  {resource.url ? (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-lg bg-explore-teal px-4 py-2 text-sm font-semibold text-white"
                    >
                      Open Link
                    </a>
                  ) : resource.filePath ? (
                    <a
                      href={`/api/files/private/${resource.filePath}`}
                      className="inline-block rounded-lg bg-explore-teal px-4 py-2 text-sm font-semibold text-white"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

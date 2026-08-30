import connectDB from "@/lib/db";
import { Resource } from "@/models";
import { TUTOR_RESOURCE_TYPE_LABELS, type TutorResourceType } from "@/lib/tutor/constants";

export const dynamic = "force-dynamic";

export default async function TutorResourcesPage() {
  await connectDB();
  const [academy] = await Promise.all([
    Resource.find({ isPublic: true }).populate("createdBy", "name").sort({ createdAt: -1 }).lean(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold">Resource Library</h2>
        <p className="mt-1 text-sm text-gray-500">
          Academy curriculum materials, lesson plans, worksheets, and resources uploaded by
          administration.
        </p>
      </div>

      {academy.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm text-gray-500">
          No academy resources yet. Administration can publish public resources for tutors.
        </div>
      ) : (
        <div className="grid gap-4">
          {academy.map((resource) => {
            const creator = resource.createdBy as unknown as { name?: string };
            const typeLabel =
              TUTOR_RESOURCE_TYPE_LABELS[resource.type as TutorResourceType] ?? resource.type;
            return (
              <article key={resource._id.toString()} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                      {typeLabel}
                    </span>
                    <h3 className="mt-2 font-semibold">{resource.title}</h3>
                    {resource.description && (
                      <p className="mt-1 text-sm text-gray-500">{resource.description}</p>
                    )}
                    {creator?.name && (
                      <p className="mt-2 text-xs text-gray-400">By {creator.name}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Open
                      </a>
                    )}
                    {resource.filePath && (
                      <a
                        href={`/api/files/private/${resource.filePath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border px-4 py-2 text-sm font-semibold"
                      >
                        Download
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

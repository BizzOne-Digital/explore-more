import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getParentLearningResources } from "@/lib/parent/learning";

function ResourceAction({
  url,
  filePath,
}: {
  url?: string;
  filePath?: string;
}) {
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-lg bg-explore-teal px-4 py-2 text-sm font-semibold text-white"
      >
        Open Link
      </a>
    );
  }

  if (filePath) {
    return (
      <a
        href={`/api/files/private/${filePath}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-lg bg-explore-teal px-4 py-2 text-sm font-semibold text-white"
      >
        Download
      </a>
    );
  }

  return null;
}

export default async function ParentResourcesPage() {
  const session = await auth();
  if (!session?.user) redirect("/parent/login?callbackUrl=/parent/resources");

  const resources = await getParentLearningResources(session.user.id);
  const academyResources = resources.filter((r) => r.source === "academy");
  const accountFiles = resources.filter((r) => r.source === "account");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold">My Resources</h2>
        <p className="mt-1 text-sm text-explore-charcoal/70">
          Worksheets, readings, and files shared by Explore More Academy, tutors, or uploaded to
          your family accounts.
        </p>
      </div>

      <section className="space-y-4">
        <h3 className="font-display text-lg font-semibold text-explore-charcoal">
          Academy &amp; Tutor Resources
        </h3>
        {academyResources.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-explore-charcoal/60">No shared resources yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {academyResources.map((resource) => (
              <article
                key={resource.id}
                className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-explore-sand px-2 py-0.5 text-xs font-medium uppercase">
                      {resource.type}
                    </span>
                    {resource.courseTitle && (
                      <span className="text-xs text-explore-charcoal/50">{resource.courseTitle}</span>
                    )}
                    {resource.studentName && (
                      <span className="text-xs font-medium text-explore-teal">
                        For {resource.studentName}
                      </span>
                    )}
                  </div>
                  <h4 className="mt-2 font-semibold text-explore-charcoal">{resource.title}</h4>
                  {resource.description && (
                    <p className="mt-1 text-sm text-explore-charcoal/60">{resource.description}</p>
                  )}
                  {resource.uploadedByName && (
                    <p className="mt-1 text-xs text-explore-charcoal/50">
                      Shared by {resource.uploadedByName}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  <ResourceAction url={resource.url} filePath={resource.filePath} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-lg font-semibold text-explore-charcoal">
          Files on Your Account
        </h3>
        {accountFiles.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-explore-charcoal/60">No files uploaded to your accounts yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {accountFiles.map((resource) => (
              <article
                key={resource.id}
                className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-explore-teal/10 px-2 py-0.5 text-xs font-medium text-explore-teal">
                      Account file
                    </span>
                    {resource.studentName ? (
                      <span className="text-xs text-explore-charcoal/50">
                        {resource.studentName}&apos;s account
                      </span>
                    ) : (
                      <span className="text-xs text-explore-charcoal/50">Your account</span>
                    )}
                  </div>
                  <h4 className="mt-2 font-semibold text-explore-charcoal">{resource.title}</h4>
                  {resource.description && (
                    <p className="mt-1 text-sm text-explore-charcoal/60">{resource.description}</p>
                  )}
                  {resource.uploadedByName && (
                    <p className="mt-1 text-xs text-explore-charcoal/50">
                      Uploaded by {resource.uploadedByName}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  <ResourceAction filePath={resource.filePath} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Result } from "@/models";

export default async function StudentResultsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/student/results");

  await connectDB();

  const results = await Result.find({
    studentId: session.user.id,
    publishedToStudent: true,
  })
    .populate("courseId", "title")
    .populate("programId", "title")
    .sort({ date: -1 });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-explore-charcoal">My Results</h2>
        <p className="mt-1 text-explore-charcoal/70">
          Academic results published by your instructors.
        </p>
      </div>

      {results.length === 0 ? (
        <div className="rounded-2xl bg-explore-white p-8 text-center shadow-sm">
          <p className="text-explore-charcoal/60">No results have been published yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-explore-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-explore-sand bg-explore-cream">
                <tr>
                  <th className="px-4 py-3 font-semibold">Subject</th>
                  <th className="px-4 py-3 font-semibold">Assessment</th>
                  <th className="px-4 py-3 font-semibold">Score</th>
                  <th className="px-4 py-3 font-semibold">Grade</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Term</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result._id.toString()} className="border-b border-explore-sand/50">
                    <td className="px-4 py-3 font-medium">{result.subject}</td>
                    <td className="px-4 py-3">{result.assessment}</td>
                    <td className="px-4 py-3">
                      {result.score != null && result.maxScore != null
                        ? `${result.score}/${result.maxScore}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">{result.grade ?? "—"}</td>
                    <td className="px-4 py-3">
                      {new Date(result.date).toLocaleDateString("en-US")}
                    </td>
                    <td className="px-4 py-3">{result.term ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {results.some((r) => r.feedback) && (
        <div className="space-y-4">
          <h3 className="font-display text-lg text-explore-charcoal">Feedback</h3>
          {results
            .filter((r) => r.feedback)
            .map((result) => (
              <div
                key={`fb-${result._id.toString()}`}
                className="rounded-xl bg-explore-white p-4 shadow-sm"
              >
                <p className="text-sm font-semibold">
                  {result.subject} — {result.assessment}
                </p>
                <p className="mt-2 text-sm text-explore-charcoal/70">{result.feedback}</p>
                {result.privateAttachment && (
                  <a
                    href={`/api/files/private/${result.privateAttachment}`}
                    className="mt-2 inline-block text-sm text-explore-teal hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View attachment
                  </a>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

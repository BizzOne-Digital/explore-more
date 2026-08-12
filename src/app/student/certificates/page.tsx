import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Certificate } from "@/models";

export default async function StudentCertificatesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/student/certificates");

  await connectDB();

  const certificates = await Certificate.find({ studentId: session.user.id })
    .populate("courseId", "title")
    .populate("programId", "title")
    .sort({ issueDate: -1 });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-explore-charcoal">My Certificates</h2>
        <p className="mt-1 text-explore-charcoal/70">Download your earned certificates.</p>
      </div>

      {certificates.length === 0 ? (
        <div className="rounded-2xl bg-explore-white p-8 text-center shadow-sm">
          <p className="text-explore-charcoal/60">No certificates yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {certificates.map((cert) => {
            const course = cert.courseId as { title?: string } | null;
            const program = cert.programId as { title?: string } | null;

            return (
              <article
                key={cert._id.toString()}
                className="rounded-2xl border border-explore-sand bg-explore-white p-6 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-explore-lime/30">
                  <span className="text-xl">🏅</span>
                </div>
                <h3 className="mt-4 font-display text-lg text-explore-charcoal">{cert.title}</h3>
                {(course?.title || program?.title) && (
                  <p className="mt-1 text-sm text-explore-charcoal/60">
                    {course?.title ?? program?.title}
                  </p>
                )}
                <p className="mt-2 text-sm text-explore-charcoal/50">
                  Issued{" "}
                  {new Date(cert.issueDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                {cert.verificationCode && (
                  <p className="mt-1 font-mono text-xs text-explore-charcoal/40">
                    Code: {cert.verificationCode}
                  </p>
                )}
                <a
                  href={`/api/files/private/${cert.filePath}`}
                  className="mt-4 inline-block rounded-lg bg-explore-teal px-4 py-2 text-sm font-semibold text-white"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download
                </a>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

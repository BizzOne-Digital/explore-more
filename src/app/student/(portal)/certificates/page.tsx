import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Certificate } from "@/models";
import { getCertificateAssociation, getCertificateFileUrl } from "@/lib/certificates/display";

export default async function StudentCertificatesPage() {
  const session = await auth();
  if (!session?.user) redirect("/student/login?callbackUrl=/student/certificates");

  await connectDB();

  const certificates = await Certificate.find({
    studentId: session.user.id,
    publishedToStudent: { $ne: false },
  }).sort({ issueDate: -1 });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-explore-charcoal">My Certificates</h2>
        <p className="mt-1 text-explore-charcoal/70">
          View, download, and save your certificates from Explore More Academy.
        </p>
      </div>

      {certificates.length === 0 ? (
        <div className="rounded-2xl bg-explore-white p-8 text-center shadow-sm">
          <p className="text-explore-charcoal/60">No certificates yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {certificates.map((cert) => {
            const association = getCertificateAssociation(cert);
            const fileUrl = getCertificateFileUrl(cert.filePath);

            return (
              <article
                key={cert._id.toString()}
                className="rounded-2xl border border-explore-sand bg-explore-white p-6 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-explore-lime/30">
                  <span className="text-xl">🏅</span>
                </div>
                <h3 className="mt-4 font-display text-lg text-explore-charcoal">{cert.title}</h3>
                {cert.description && (
                  <p className="mt-1 text-sm text-explore-charcoal/60">{cert.description}</p>
                )}
                {association && (
                  <p className="mt-2 text-sm text-explore-charcoal/70">{association}</p>
                )}
                <p className="mt-2 text-sm text-explore-charcoal/50">
                  Issued{" "}
                  {new Date(cert.issueDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-explore-teal px-4 py-2 text-sm font-semibold text-white"
                  >
                    {cert.fileType === "pdf" ? "View PDF" : "Open Certificate"}
                  </a>
                  <a
                    href={fileUrl}
                    download
                    className="rounded-lg border border-explore-charcoal/15 px-4 py-2 text-sm font-semibold text-explore-charcoal"
                  >
                    Download
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

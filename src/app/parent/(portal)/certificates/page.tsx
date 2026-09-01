import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLinkedStudents } from "@/lib/parent/students";
import { getCertificatesForGuardian } from "@/lib/parent/certificates";
import { CertificateListItem } from "@/components/parent/CertificateListItem";
import { LinkChildForm } from "@/components/parent/LinkChildForm";

export default async function ParentCertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/parent/login?callbackUrl=/parent/certificates");

  const params = await searchParams;
  const [students, allCertificates] = await Promise.all([
    getLinkedStudents(session.user.id),
    getCertificatesForGuardian(session.user.id),
  ]);

  const selectedStudentId = params.student || students[0]?.id;
  const certificates = selectedStudentId
    ? allCertificates.filter((cert) => cert.studentId === selectedStudentId)
    : allCertificates;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-explore-charcoal">Certificates</h2>
        <p className="mt-1 text-explore-charcoal/70">
          View, download, and print certificates issued to your linked children.
        </p>
      </div>

      {students.length === 0 ? (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-explore-charcoal/60">Link a child to view their certificates.</p>
          </div>
          <LinkChildForm />
        </div>
      ) : (
        <>
          {students.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <Link
                href="/parent/certificates"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  !params.student ? "bg-explore-teal text-white" : "bg-explore-sand text-explore-charcoal"
                }`}
              >
                All Children
              </Link>
              {students.map((student) => (
                <Link
                  key={student.id}
                  href={`/parent/certificates?student=${student.id}`}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    selectedStudentId === student.id && params.student
                      ? "bg-explore-teal text-white"
                      : "bg-explore-sand text-explore-charcoal"
                  }`}
                >
                  {student.name}
                </Link>
              ))}
            </div>
          )}

          {certificates.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <p className="text-explore-charcoal/60">No certificates have been published yet.</p>
              <p className="mt-2 text-sm text-explore-charcoal/50">
                Certificates appear here after they are issued and published by the academy.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {certificates.map((cert) => (
                <li key={cert.id}>
                  {students.length > 1 && !params.student && (
                    <p className="mb-2 text-sm font-medium text-explore-teal">{cert.studentName}</p>
                  )}
                  <CertificateListItem
                    cert={{
                      _id: cert.id,
                      title: cert.title,
                      description: cert.description,
                      issueDate: cert.issueDate,
                      filePath: cert.filePath,
                      fileType: cert.fileType,
                      associatedCourse: cert.associatedCourse,
                      associatedProgram: cert.associatedProgram,
                      associatedEvent: cert.associatedEvent,
                    }}
                  />
                </li>
              ))}
            </ul>
          )}

          <p className="text-sm text-explore-charcoal/50">
            You can also view certificates on each child&apos;s profile under{" "}
            <Link href="/parent/students" className="text-explore-teal hover:underline">
              My Children
            </Link>
            .
          </p>
        </>
      )}
    </div>
  );
}

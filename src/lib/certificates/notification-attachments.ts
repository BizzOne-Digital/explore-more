import connectDB from "@/lib/db";
import { Certificate } from "@/models";
import { getLinkedStudents } from "@/lib/parent/students";

export const CERTIFICATE_NOTIFICATION_TITLE = "New Certificate Awarded!";

export type ParentNotificationListItem = {
  title: string;
  message: string;
  attachmentPath?: string;
  attachmentName?: string;
};

function parseCertificateTitle(message: string): string | null {
  const line = message.split("\n").find((entry) => entry.trim().startsWith("Certificate:"));
  if (!line) return null;
  const title = line.replace(/^Certificate:\s*/i, "").trim();
  return title || null;
}

export async function enrichCertificateNotificationAttachments<T extends ParentNotificationListItem>(
  guardianId: string,
  items: T[]
): Promise<T[]> {
  const needsEnrich = items.some(
    (item) => item.title === CERTIFICATE_NOTIFICATION_TITLE && !item.attachmentPath?.trim()
  );
  if (!needsEnrich) return items;

  await connectDB();
  const students = await getLinkedStudents(guardianId);
  const studentIds = students.map((student) => student.id);
  if (studentIds.length === 0) return items;

  const certificates = await Certificate.find({
    studentId: { $in: studentIds },
    publishedToStudent: { $ne: false },
    filePath: { $exists: true, $nin: [null, ""] },
  })
    .select("title filePath fileType issueDate")
    .sort({ issueDate: -1 })
    .lean();

  return items.map((item) => {
    if (item.attachmentPath?.trim() || item.title !== CERTIFICATE_NOTIFICATION_TITLE) {
      return item;
    }

    const certTitle = parseCertificateTitle(item.message);
    if (!certTitle) return item;

    const certificate =
      certificates.find((cert) => cert.title === certTitle) ??
      certificates.find((cert) => item.message.includes(cert.title));

    if (!certificate?.filePath) return item;

    const extension = certificate.fileType === "pdf" ? "pdf" : "png";
    return {
      ...item,
      attachmentPath: certificate.filePath,
      attachmentName: `${certificate.title}.${extension}`,
    };
  });
}

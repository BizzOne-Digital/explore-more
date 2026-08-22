import connectDB from "@/lib/db";
import { Certificate, GuardianStudentLink, ParentNotification, User } from "@/models";
import { sendTransactionalEmail } from "@/lib/services/email";
import { getCertificateAssociation, getCertificateFileUrl } from "@/lib/certificates/display";
import { Types } from "mongoose";

interface PublishResult {
  notificationSent: boolean;
  parentNotificationId?: string;
  error?: string;
}

export async function publishCertificateToStudent(
  certificateId: string,
  issuedByUserId: string
): Promise<PublishResult> {
  await connectDB();

  const certificate = await Certificate.findById(certificateId).lean();

  if (!certificate) {
    throw new Error("Certificate not found");
  }

  await Certificate.findByIdAndUpdate(certificateId, {
    publishedToStudent: true,
    publishedAt: new Date(),
  });

  const student = await User.findOne({ _id: certificate.studentId, role: "student" })
    .select("name studentId")
    .lean();

  if (!student) {
    return { notificationSent: false, error: "Student not found on certificate" };
  }

  const guardianLink = await GuardianStudentLink.findOne({
    studentId: certificate.studentId,
    status: "approved",
  })
    .populate("guardianId", "name email")
    .lean();

  if (!guardianLink?.guardianId) {
    return { notificationSent: false, error: "No linked parent account for this student" };
  }

  const guardian = guardianLink.guardianId as unknown as {
    _id: Types.ObjectId;
    name: string;
    email: string;
  };
  const association = getCertificateAssociation(certificate);
  const issueDate = new Date(certificate.issueDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const fileUrl = getCertificateFileUrl(certificate.filePath);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3004";
  const studentProfileUrl = `${appUrl}/parent/students/${student._id.toString()}`;

  const notificationTitle = "New Certificate Awarded!";
  const notificationMessage = [
    `Your student, ${student.name}, has received a new certificate from Explore More Academy.`,
    "",
    `Certificate: ${certificate.title}`,
    association ? `Course/Program/Event: ${association}` : null,
    `Date Issued: ${issueDate}`,
    "",
    `View in Parent Portal: ${studentProfileUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const parentNotification = await ParentNotification.create({
    title: notificationTitle,
    message: notificationMessage,
    audience: "custom",
    recipientIds: [guardian._id],
    priority: "normal",
    sentBy: issuedByUserId,
    sentAt: new Date(),
  });

  const htmlBody = `
    <p>Your student, <strong>${student.name}</strong>, has received a new certificate from Explore More Academy.</p>
    <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="margin:0 0 8px;"><strong>Certificate:</strong> ${certificate.title}</p>
      ${association ? `<p style="margin:0 0 8px;"><strong>Course/Program/Event:</strong> ${association}</p>` : ""}
      <p style="margin:0;"><strong>Date Issued:</strong> ${issueDate}</p>
    </div>
    <p><a href="${fileUrl}" style="color:#0c8991;font-weight:bold;">View Certificate</a></p>
    <p><a href="${studentProfileUrl}" style="color:#0c8991;">Open Parent Portal</a></p>
  `;

  try {
    await sendTransactionalEmail({
      to: guardian.email,
      subject: notificationTitle,
      htmlBody,
      template: "notification",
    });
  } catch (err) {
    console.error("Certificate email failed:", err);
  }

  await Certificate.findByIdAndUpdate(certificateId, {
    notificationSent: true,
    notificationSentAt: new Date(),
  });

  return {
    notificationSent: true,
    parentNotificationId: parentNotification._id.toString(),
  };
}

/** Issue the same certificate file/details to additional students. */
export async function issueCertificateToStudents(
  sourceCertificateId: string,
  studentIds: string[],
  issuedByUserId: string,
  publish = true
): Promise<Array<{ studentId: string; certificateId: string; published: boolean; error?: string }>> {
  await connectDB();

  const source = await Certificate.findById(sourceCertificateId).lean();
  if (!source) throw new Error("Source certificate not found");

  const results: Array<{ studentId: string; certificateId: string; published: boolean; error?: string }> = [];

  for (const studentId of studentIds) {
    const student = await User.findOne({ _id: studentId, role: "student" }).select("_id name");
    if (!student) {
      results.push({ studentId, certificateId: "", published: false, error: "Student not found" });
      continue;
    }

    const created = await Certificate.create({
      studentId: student._id,
      title: source.title,
      description: source.description,
      associatedCourse: source.associatedCourse,
      associatedProgram: source.associatedProgram,
      associatedEvent: source.associatedEvent,
      grade: source.grade,
      issueDate: source.issueDate,
      filePath: source.filePath,
      fileType: source.fileType,
      verificationCode: source.verificationCode,
      isShareable: source.isShareable,
      issuedBy: issuedByUserId,
      publishedToStudent: false,
      notificationSent: false,
    });

    let published = false;
    let error: string | undefined;

    if (publish) {
      const result = await publishCertificateToStudent(created._id.toString(), issuedByUserId);
      published = result.notificationSent;
      error = result.error;
    }

    results.push({
      studentId,
      certificateId: created._id.toString(),
      published,
      error,
    });
  }

  return results;
}

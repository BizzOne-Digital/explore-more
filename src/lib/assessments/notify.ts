import connectDB from "@/lib/db";
import { ParentNotification, User } from "@/models";
import { sendTransactionalEmail } from "@/lib/services/email";
import { formatGradeLabel } from "@/lib/grades";
import { getUniqueParentIdsForGrade } from "@/lib/assessments/queries";
import type { GradeLevel } from "@/lib/grades";

export async function notifyParentsOfNewAssessment(
  assessmentTitle: string,
  grade: GradeLevel,
  sentByUserId: string
): Promise<{ notifiedCount: number }> {
  await connectDB();

  const parentIds = await getUniqueParentIdsForGrade(grade);
  if (parentIds.length === 0) {
    return { notifiedCount: 0 };
  }

  const gradeLabel = formatGradeLabel(grade);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3004";
  const assessmentsUrl = `${appUrl}/parent/assessments`;

  const title = "New Assessment Available";
  const message = [
    `A new assessment "${assessmentTitle}" is available for ${gradeLabel}.`,
    "",
    "Please download the assessment from the Parent Portal, complete it with your child, and resubmit the PDF.",
    "",
    `Open Assessments: ${assessmentsUrl}`,
  ].join("\n");

  await ParentNotification.create({
    title,
    message,
    audience: "custom",
    recipientIds: parentIds,
    priority: "important",
    sentBy: sentByUserId,
    sentAt: new Date(),
  });

  const parents = await User.find({ _id: { $in: parentIds }, isActive: { $ne: false } })
    .select("email name")
    .lean();

  for (const parent of parents) {
    try {
      await sendTransactionalEmail({
        to: parent.email,
        subject: title,
        htmlBody: `
          <p>Hello ${parent.name},</p>
          <p>A new assessment <strong>${assessmentTitle}</strong> is available for <strong>${gradeLabel}</strong>.</p>
          <p>Please download the assessment from the Parent Portal, complete it with your child, and resubmit the PDF.</p>
          <p><a href="${assessmentsUrl}" style="color:#0c8991;font-weight:bold;">Open Assessments</a></p>
        `,
        template: "notification",
      });
    } catch (err) {
      console.error("Assessment notification email failed:", err);
    }
  }

  return { notifiedCount: parentIds.length };
}

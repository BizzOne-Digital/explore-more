import connectDB from "@/lib/db";
import { Assessment, AssessmentSubmission, ParentNotification, User } from "@/models";
import { sendTransactionalEmail } from "@/lib/services/email";
import { isLetterGrade } from "@/lib/assessments/constants";
import type { Types } from "mongoose";

export async function publishAssessmentGrade(
  submissionId: string,
  letterGrade: string,
  gradedByUserId: string
): Promise<{ published: boolean; error?: string }> {
  if (!isLetterGrade(letterGrade)) {
    throw new Error("Invalid letter grade");
  }

  await connectDB();

  const submission = await AssessmentSubmission.findById(submissionId).lean();
  if (!submission) {
    throw new Error("Submission not found");
  }

  const assessment = await Assessment.findById(submission.assessmentId).lean();
  if (!assessment) {
    throw new Error("Assessment not found");
  }

  const [parent, student] = await Promise.all([
    User.findById(submission.parentId).select("name email").lean(),
    User.findById(submission.studentId).select("name").lean(),
  ]);

  if (!parent) {
    return { published: false, error: "Parent not found" };
  }

  await AssessmentSubmission.findByIdAndUpdate(submissionId, {
    letterGrade,
    published: true,
    publishedAt: new Date(),
    gradedBy: gradedByUserId,
    gradedAt: new Date(),
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3004";
  const title = `Assessment Result: ${assessment.title}`;
  const message = [
    `The graded result for "${assessment.title}" is now available.`,
    "",
    `Student: ${student?.name ?? "Your child"}`,
    `Grade: ${letterGrade}`,
    "",
    `View in Parent Portal: ${appUrl}/parent/assessments`,
  ].join("\n");

  await ParentNotification.create({
    title,
    message,
    audience: "custom",
    recipientIds: [parent._id as Types.ObjectId],
    priority: "normal",
    sentBy: gradedByUserId,
    sentAt: new Date(),
  });

  try {
    await sendTransactionalEmail({
      to: parent.email,
      subject: title,
      htmlBody: `
        <p>Hello ${parent.name},</p>
        <p>The graded result for <strong>${assessment.title}</strong> is now available.</p>
        <p><strong>Student:</strong> ${student?.name ?? "Your child"}<br/>
        <strong>Grade:</strong> ${letterGrade}</p>
        <p><a href="${appUrl}/parent/assessments" style="color:#0c8991;font-weight:bold;">View in Parent Portal</a></p>
      `,
      template: "notification",
    });
  } catch (err) {
    console.error("Assessment grade email failed:", err);
  }

  return { published: true };
}

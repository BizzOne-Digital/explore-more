import connectDB from "@/lib/db";
import { Course, Enrollment } from "@/models";
import { queueEmail, emailTemplates } from "@/lib/services/email";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth-helpers";
import { getCoursePriceCents } from "@/lib/pricing";

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const sessionResult = await requireSession();
  if ("error" in sessionResult) return sessionResult.error;

  if (!sessionResult.user.emailVerified) {
    return jsonError("Please verify your email before enrolling", 403);
  }

  const { slug } = await context.params;

  await connectDB();

  const course = await Course.findOne({ slug, status: "published" });

  if (!course) {
    return jsonError("Course not found", 404);
  }

  if (course.enrollmentStatus === "closed") {
    return jsonError("Enrollment is closed for this course", 400);
  }

  if (getCoursePriceCents(course) > 0) {
    return jsonError("This is a paid course. Use checkout instead.", 400);
  }

  const existing = await Enrollment.findOne({
    courseId: course._id,
    userId: sessionResult.user.id,
  });

  if (existing && existing.status !== "cancelled") {
    return jsonError("You are already enrolled in this course", 409);
  }

  const enrollment =
    existing ??
    (await Enrollment.create({
      courseId: course._id,
      userId: sessionResult.user.id,
      paymentStatus: "free",
      status: "active",
    }));

  if (existing) {
    enrollment.paymentStatus = "free";
    enrollment.status = "active";
    await enrollment.save();
  }

  const template = emailTemplates.enrollmentConfirmation(
    sessionResult.user.name,
    course.title
  );

  await queueEmail({
    to: sessionResult.user.email,
    subject: template.subject,
    htmlBody: template.html,
    template: "enrollmentConfirmation",
    metadata: { enrollmentId: enrollment._id.toString() },
  });

  return jsonOk(
    { message: "Successfully enrolled", enrollmentId: enrollment._id.toString() },
    201
  );
}

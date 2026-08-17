import { z } from "zod";
import connectDB from "@/lib/db";
import { Course, Enrollment } from "@/models";
import { createCheckoutSession, getAppUrl, isStripeConfigured } from "@/lib/services/stripe";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth-helpers";
import { getCoursePriceCents } from "@/lib/pricing";

const checkoutSchema = z.object({
  courseSlug: z.string().min(1),
});

export async function POST(request: Request) {
  const sessionResult = await requireSession();
  if ("error" in sessionResult) return sessionResult.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Course slug is required");
  }

  await connectDB();

  const course = await Course.findOne({
    slug: parsed.data.courseSlug,
    status: "published",
  });

  if (!course) {
    return jsonError("Course not found", 404);
  }

  if (course.enrollmentStatus === "closed") {
    return jsonError("Enrollment is closed for this course", 400);
  }

  const existing = await Enrollment.findOne({
    courseId: course._id,
    userId: sessionResult.user.id,
  });

  if (existing && existing.status !== "cancelled") {
    return jsonError("You are already enrolled in this course", 409);
  }

  const priceCents = getCoursePriceCents(course);

  if (course.isFree || priceCents === 0) {
    return jsonError("This course is free. Use the enroll endpoint instead.", 400);
  }

  if (!isStripeConfigured()) {
    return jsonError("Payment system is not configured", 503);
  }

  const enrollment =
    existing ??
    (await Enrollment.create({
      courseId: course._id,
      userId: sessionResult.user.id,
      paymentStatus: "pending",
      status: "active",
    }));

  if (existing) {
    enrollment.paymentStatus = "pending";
    await enrollment.save();
  }

  const appUrl = getAppUrl();
  const session = await createCheckoutSession({
    lineItems: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: course.title, description: course.shortDescription },
          unit_amount: priceCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      checkoutType: "course",
      enrollmentId: enrollment._id.toString(),
      courseId: course._id.toString(),
    },
    customerEmail: sessionResult.user.email,
    successUrl: `${appUrl}/courses/${course.slug}?enrolled=true`,
    cancelUrl: `${appUrl}/courses/${course.slug}`,
  });

  enrollment.stripeSessionId = session.id;
  await enrollment.save();

  return jsonOk({ sessionId: session.id, url: session.url });
}

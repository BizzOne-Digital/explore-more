import { NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { Course, Enrollment } from "@/models";
import { createCheckoutSession, getAppUrl, getStripe } from "@/lib/services/stripe";
import { getCoursePriceCents } from "@/lib/pricing";
import { stripeProductData } from "@/lib/stripe/tax-codes";

const schema = z.object({
  courseId: z.string(),
  courseSlug: z.string(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, courseSlug } = schema.parse(body);
    await connectDB();

    const course = await Course.findOne({ _id: courseId, slug: courseSlug, status: "published" });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (course.enrollmentStatus === "closed") {
      return NextResponse.json({ error: "Enrollment is closed" }, { status: 400 });
    }

    const existing = await Enrollment.findOne({ courseId: course._id, userId: session.user.id });
    if (existing && existing.paymentStatus === "paid") {
      return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
    }

    const priceCents = getCoursePriceCents(course);
    const isFree = priceCents === 0;

    if (isFree) {
      if (!existing) {
        await Enrollment.create({
          courseId: course._id,
          userId: session.user.id,
          paymentStatus: "free",
          status: "active",
        });
      }
      return NextResponse.json({ success: true });
    }

    const stripe = getStripe();
    if (!stripe) {
      if (!existing) {
        await Enrollment.create({
          courseId: course._id,
          userId: session.user.id,
          paymentStatus: "pending",
          status: "active",
        });
      }
      return NextResponse.json({ success: true, manual: true });
    }

    const enrollment =
      existing ??
      (await Enrollment.create({
        courseId: course._id,
        userId: session.user.id,
        paymentStatus: "pending",
        status: "active",
      }));

    if (existing) {
      enrollment.paymentStatus = "pending";
      await enrollment.save();
    }

    const checkoutSession = await createCheckoutSession({
      lineItems: [
        {
          price_data: {
            currency: "usd",
            product_data: stripeProductData(
              { name: course.title, description: course.shortDescription },
              "courses"
            ),
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
        userId: session.user.id,
      },
      customerEmail: session.user.email ?? undefined,
      successUrl: `${getAppUrl()}/student?enrolled=${courseSlug}`,
      cancelUrl: `${getAppUrl()}/courses/${courseSlug}`,
    });

    enrollment.stripeSessionId = checkoutSession.id;
    await enrollment.save();

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Enrollment failed" }, { status: 500 });
  }
}

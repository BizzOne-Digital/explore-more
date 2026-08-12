import { NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { Course, Enrollment } from "@/models";
import { createCheckoutSession, getAppUrl, getStripe } from "@/lib/services/stripe";

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
    if (existing) {
      return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
    }

    const isFree = course.isFree || course.priceCents === 0;

    if (isFree) {
      await Enrollment.create({
        courseId: course._id,
        userId: session.user.id,
        paymentStatus: "free",
        status: "active",
      });
      return NextResponse.json({ success: true });
    }

    const stripe = getStripe();
    if (!stripe) {
      await Enrollment.create({
        courseId: course._id,
        userId: session.user.id,
        paymentStatus: "pending",
        status: "active",
      });
      return NextResponse.json({ success: true, manual: true });
    }

    const checkoutSession = await createCheckoutSession({
      lineItems: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: course.title, description: course.shortDescription },
            unit_amount: course.priceCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        type: "enrollment",
        courseId: course._id.toString(),
        userId: session.user.id,
      },
      customerEmail: session.user.email ?? undefined,
      successUrl: `${getAppUrl()}/student?enrolled=${courseSlug}`,
      cancelUrl: `${getAppUrl()}/courses/${courseSlug}`,
    });

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Enrollment failed" }, { status: 500 });
  }
}

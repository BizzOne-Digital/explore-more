import { Order, Donation, Enrollment, EventRegistration, Course, Event } from "@/models";
import type { Types } from "mongoose";

export interface PaymentHistoryItem {
  id: string;
  date: Date;
  description: string;
  amountCents: number;
  status: string;
  type: "order" | "donation" | "enrollment" | "event";
  reference?: string;
}

export async function getPaymentHistoryForParent(params: {
  userId: string;
  email: string;
}): Promise<PaymentHistoryItem[]> {
  const userObjectId = params.userId as unknown as Types.ObjectId;
  const items: PaymentHistoryItem[] = [];

  const [orders, donations, enrollments, eventRegs] = await Promise.all([
    Order.find({
      $or: [{ userId: params.userId }, { customerEmail: params.email }],
      paymentStatus: { $in: ["paid", "manual", "refunded", "failed", "pending"] },
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
    Donation.find({ donorEmail: params.email })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    Enrollment.find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    EventRegistration.find({
      $or: [{ userId: params.userId }, { guardianEmail: params.email }],
      registrationType: "paid",
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
  ]);

  for (const o of orders) {
    items.push({
      id: o._id.toString(),
      date: o.createdAt,
      description: o.items?.map((i) => i.title).join(", ") || "Order",
      amountCents: o.totalCents,
      status: o.paymentStatus,
      type: "order",
      reference: o.orderNumber,
    });
  }

  for (const d of donations) {
    items.push({
      id: d._id.toString(),
      date: d.createdAt,
      description: "Donation",
      amountCents: d.amountCents,
      status: d.paymentStatus,
      type: "donation",
      reference: `DON-${d._id.toString().slice(-8).toUpperCase()}`,
    });
  }

  const courseIds = [...new Set(enrollments.map((e) => e.courseId.toString()))];
  const courses = courseIds.length
    ? await Course.find({ _id: { $in: courseIds } }).select("title priceAmount").lean()
    : [];
  const courseMap = new Map(courses.map((c) => [c._id.toString(), c]));

  for (const e of enrollments) {
    if (e.paymentStatus === "free") continue;
    const course = courseMap.get(e.courseId.toString());
    items.push({
      id: e._id.toString(),
      date: e.enrolledAt ?? e.createdAt,
      description: course?.title ? `Course — ${course.title}` : "Course enrollment",
      amountCents: Math.round((course?.priceAmount ?? 0) * 100),
      status: e.paymentStatus,
      type: "enrollment",
    });
  }

  const eventIds = [...new Set(eventRegs.map((r) => r.eventId.toString()))];
  const events = eventIds.length
    ? await Event.find({ _id: { $in: eventIds } }).select("title").lean()
    : [];
  const eventMap = new Map(events.map((ev) => [ev._id.toString(), ev]));

  for (const r of eventRegs) {
    if (r.paymentStatus === "free") continue;
    const event = eventMap.get(r.eventId.toString());
    items.push({
      id: r._id.toString(),
      date: r.createdAt,
      description: event?.title ? `Event — ${event.title}` : "Event registration",
      amountCents: Math.round((r.paymentAmount ?? 0) * 100),
      status: r.paymentStatus,
      type: "event",
      reference: r.registrationId,
    });
  }

  items.sort((a, b) => b.date.getTime() - a.date.getTime());
  return items;
}

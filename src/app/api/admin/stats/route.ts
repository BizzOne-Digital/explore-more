import connectDB from "@/lib/db";
import { User, Event, Order, Donation, ServiceRequest, ContactMessage } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";

export async function GET() {
  try {
    await connectDB();
    const [students, events, orders, donations, requests, messages] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Event.countDocuments({ status: "published" }),
      Order.countDocuments(),
      Donation.countDocuments({ paymentStatus: "paid" }),
      ServiceRequest.countDocuments({ status: "new" }),
      ContactMessage.countDocuments({ status: "new" }),
    ]);
    return apiSuccess({ students, events, orders, donations, requests, messages });
  } catch (error) {
    return apiError(error);
  }
}

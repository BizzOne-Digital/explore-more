import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Order, OrderModificationRequest } from "@/models";
import { sendTransactionalEmail } from "@/lib/services/email";
import { getAdminEmail } from "@/lib/email/get-admin-email";
import { z } from "zod";

const requestSchema = z.object({
  orderId: z.string(),
  requestType: z.enum(["add_item", "remove_item", "cancel_order", "change_address"]),
  requestDetails: z.object({
    itemsToAdd: z.array(z.object({
      bookId: z.string(),
      title: z.string(),
      quantity: z.number(),
    })).optional(),
    itemsToRemove: z.array(z.string()).optional(),
    newAddress: z.object({
      name: z.string(),
      line1: z.string(),
      line2: z.string().optional(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
      country: z.string(),
    }).optional(),
    reason: z.string().optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = requestSchema.parse(body);

    await connectDB();

    // Verify order belongs to user
    const order = await Order.findById(data.orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId?.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if order can be modified (only pending or paid orders)
    if (!["pending", "paid"].includes(order.paymentStatus)) {
      return NextResponse.json(
        { error: "Order cannot be modified" },
        { status: 400 }
      );
    }

    // Create modification request
    const modRequest = await OrderModificationRequest.create({
      orderId: data.orderId,
      userId: session.user.id,
      requestType: data.requestType,
      requestDetails: data.requestDetails,
      status: "pending",
    });

    // Send email to admin
    const adminEmail = getAdminEmail();
    
    const requestTypeLabels = {
      add_item: "Add Item(s)",
      remove_item: "Remove Item(s)",
      cancel_order: "Cancel Order",
      change_address: "Change Shipping Address",
    };

    await sendTransactionalEmail({
      to: adminEmail,
      subject: `Order Modification Request - Order #${order.orderNumber}`,
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0c8991;">New Order Modification Request</h2>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Request Type:</strong> ${requestTypeLabels[data.requestType]}</p>
            <p style="margin: 5px 0;"><strong>Order Number:</strong> #${order.orderNumber}</p>
            <p style="margin: 5px 0;"><strong>Customer:</strong> ${order.customerName} (${order.customerEmail})</p>
            <p style="margin: 5px 0;"><strong>Request Date:</strong> ${new Date().toLocaleString()}</p>
          </div>

          ${data.requestDetails.reason ? `
            <div style="margin: 20px 0;">
              <strong>Reason:</strong>
              <p style="background: #fff; padding: 10px; border-left: 3px solid #0c8991;">${data.requestDetails.reason}</p>
            </div>
          ` : ''}

          <div style="margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004'}/admin/order-requests" 
               style="background: #0c8991; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Review Request
            </a>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated notification from Explore More Academy.
          </p>
        </div>
      `,
      template: "order-request",
    }).catch((err) => {
      console.error("Failed to send admin notification:", err);
    });

    return NextResponse.json({
      success: true,
      message: "Request submitted successfully. Admin will review it soon.",
      requestId: modRequest._id,
    });
  } catch (error) {
    console.error("Order modification request error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit request" },
      { status: 500 }
    );
  }
}

// Get user's modification requests
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const requests = await OrderModificationRequest.find({
      userId: session.user.id,
    })
      .populate("orderId", "orderNumber totalCents")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Get requests error:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

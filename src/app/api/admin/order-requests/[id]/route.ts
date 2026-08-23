import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Order, OrderModificationRequest } from "@/models";
import type { IOrder, IOrderItem } from "@/models/Book";
import { sendTransactionalEmail } from "@/lib/services/email";
import { getPublicContactEmail } from "@/lib/email/get-admin-email";
import type { Types } from "mongoose";

type PopulatedUser = { name: string; email: string };
type PopulatedOrder = IOrder & { save: () => Promise<IOrder> };

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "administrator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { action, adminNotes } = await request.json();

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await connectDB();

    const modRequest = await OrderModificationRequest.findById(id)
      .populate("orderId")
      .populate("userId", "name email");

    if (!modRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (modRequest.status !== "pending") {
      return NextResponse.json(
        { error: "Request already processed" },
        { status: 400 }
      );
    }

    const order = modRequest.orderId as unknown as PopulatedOrder;
    const user = modRequest.userId as unknown as PopulatedUser;

    modRequest.status = action === "approve" ? "approved" : "rejected";
    modRequest.adminNotes = adminNotes;
    modRequest.processedBy = session.user.id as unknown as Types.ObjectId;
    modRequest.processedAt = new Date();
    await modRequest.save();

    if (action === "approve") {
      switch (modRequest.requestType) {
        case "add_item":
          if (modRequest.requestDetails.itemsToAdd) {
            modRequest.requestDetails.itemsToAdd.forEach((item) => {
              const orderItem: IOrderItem = {
                bookId: item.bookId,
                title: item.title,
                quantity: item.quantity,
                priceCents: 0,
              };
              order.items.push(orderItem);
            });
          }
          break;

        case "remove_item":
          if (modRequest.requestDetails.itemsToRemove) {
            const removeIds = new Set(
              modRequest.requestDetails.itemsToRemove.map((itemId) => itemId.toString())
            );
            order.items = order.items.filter(
              (item) => !removeIds.has(item.bookId.toString())
            );
          }
          break;

        case "change_address":
          if (modRequest.requestDetails.newAddress) {
            order.shippingAddress = modRequest.requestDetails.newAddress;
          }
          break;

        case "cancel_order":
          order.paymentStatus = "refunded";
          break;
      }

      await order.save();
    }

    const statusText = action === "approve" ? "approved" : "rejected";
    const statusColor = action === "approve" ? "#10b981" : "#ef4444";

    await sendTransactionalEmail({
      to: user.email,
      subject: `Order Modification Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${statusColor};">
            Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}
          </h2>
          
          <p>Hello ${user.name},</p>
          
          <p>Your order modification request for Order #${order.orderNumber} has been ${statusText}.</p>

          ${adminNotes ? `
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <strong>Admin Notes:</strong>
              <p style="margin: 10px 0 0 0;">${adminNotes}</p>
            </div>
          ` : ''}

          <div style="margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004'}/parent/receipts?order=${order.orderNumber}" 
               style="background: #0c8991; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Order
            </a>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If you have any questions, please contact us at ${getPublicContactEmail()}
          </p>
        </div>
      `,
      template: "order-request-status",
    }).catch((err) => {
      console.error("Failed to send customer notification:", err);
    });

    return NextResponse.json({
      success: true,
      message: `Request ${statusText} successfully`,
    });
  } catch (error) {
    console.error("Process request error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process request" },
      { status: 500 }
    );
  }
}

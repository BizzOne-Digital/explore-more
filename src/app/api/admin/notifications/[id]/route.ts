import { z } from "zod";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError, isValidObjectId } from "@/lib/admin/api";
import { ParentNotification, ParentNotificationRead } from "@/models";
import {
  containsLocalFilesystemPath,
  stripLocalPathsFromMessage,
} from "@/lib/notifications/paths";

export const runtime = "nodejs";

const patchSchema = z.object({
  attachmentPath: z.string().min(1),
  attachmentName: z.string().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const { id } = await context.params;
    const body = patchSchema.parse(await request.json());

    await connectDB();

    const notification = await ParentNotification.findById(id);
    if (!notification) return apiError(new Error("Notification not found"), 404);

    notification.attachmentPath = body.attachmentPath.trim();
    notification.attachmentName = body.attachmentName?.trim() || undefined;

    if (containsLocalFilesystemPath(notification.message)) {
      const cleaned = stripLocalPathsFromMessage(notification.message);
      if (cleaned) notification.message = cleaned;
    }

    await notification.save();

    return apiSuccess({
      _id: notification._id.toString(),
      attachmentPath: notification.attachmentPath,
      attachmentName: notification.attachmentName,
      message: notification.message,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const { id } = await context.params;
    if (!isValidObjectId(id)) {
      return apiError(new Error("Invalid notification id"), 400);
    }

    await connectDB();

    const notificationObjectId = new mongoose.Types.ObjectId(id);
    const notification = await ParentNotification.findById(notificationObjectId);
    if (!notification) return apiError(new Error("Notification not found"), 404);

    await ParentNotificationRead.deleteMany({ notificationId: notificationObjectId });
    await ParentNotification.findByIdAndDelete(notificationObjectId);

    revalidatePath("/admin/notifications");
    revalidatePath("/parent/notifications");

    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}

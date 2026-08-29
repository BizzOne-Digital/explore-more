import { z } from "zod";
import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { ParentNotification } from "@/models";
import {
  containsLocalFilesystemPath,
  stripLocalPathsFromMessage,
} from "@/lib/notifications/display";

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

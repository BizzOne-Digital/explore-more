import connectDB from "@/lib/db";
import { ParentNotification, ParentNotificationRead } from "@/models";

function attachmentPathVariants(path: string): string[] {
  const trimmed = path.trim();
  const withoutLeading = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  const withLeading = `/${withoutLeading}`;
  return [...new Set([trimmed, withoutLeading, withLeading])];
}

export async function parentCanAccessNotificationFile(
  userId: string,
  filePath: string
): Promise<boolean> {
  await connectDB();

  const variants = attachmentPathVariants(filePath);

  const notification = await ParentNotification.findOne({
    sentAt: { $ne: null },
    attachmentPath: { $in: variants },
    $or: [{ recipientIds: userId }, { audience: "all_parents" }],
  })
    .select("_id")
    .lean();

  if (!notification) return false;

  const readRecord = await ParentNotificationRead.findOne({
    notificationId: notification._id,
    userId,
    deletedAt: { $ne: null },
  })
    .select("_id")
    .lean();

  return !readRecord;
}

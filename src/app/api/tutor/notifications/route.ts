import connectDB from "@/lib/db";
import { jsonOk } from "@/lib/api/response";
import { requireTutorPortal } from "@/lib/tutor/api-auth";
import { TutorNotification } from "@/models";

export async function GET() {
  const sessionResult = await requireTutorPortal();
  if ("error" in sessionResult) return sessionResult.error;

  await connectDB();
  const notifications = await TutorNotification.find({ userId: sessionResult.user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return jsonOk({ notifications });
}

export async function PATCH(request: Request) {
  const sessionResult = await requireTutorPortal();
  if ("error" in sessionResult) return sessionResult.error;

  const body = await request.json();
  await connectDB();

  if (body.markAllRead) {
    await TutorNotification.updateMany(
      { userId: sessionResult.user.id, readAt: { $exists: false } },
      { readAt: new Date() }
    );
    return jsonOk({ success: true });
  }

  if (body.id) {
    await TutorNotification.updateOne(
      { _id: body.id, userId: sessionResult.user.id },
      { readAt: new Date() }
    );
  }

  return jsonOk({ success: true });
}

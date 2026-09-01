import connectDB from "@/lib/db";
import { EmailCampaign } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { auth } from "@/lib/auth";
import { processEmailCampaign } from "@/lib/email/process-campaign";
import { containsLocalFilesystemPath } from "@/lib/notifications/paths";

export async function GET() {
  try {
    await connectDB();
    const items = await EmailCampaign.find().sort({ createdAt: -1 }).lean();
    return apiSuccess(items);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(new Error("Unauthorized"), 401);
    }
    await connectDB();
    const body = await request.json();

    if (
      body.status === "queued" &&
      containsLocalFilesystemPath(String(body.htmlBody ?? "")) &&
      !String(body.attachmentUrl ?? "").trim()
    ) {
      return apiError(
        new Error(
          "The message contains a file path from your computer. Upload the PDF using the Attachment field instead of pasting a local path."
        ),
        400
      );
    }

    const item = await EmailCampaign.create({
      ...body,
      createdBy: session.user.id,
      recipientCount: body.recipientCount ?? 0,
      sentCount: body.sentCount ?? 0,
      failedCount: body.failedCount ?? 0,
      openedCount: body.openedCount ?? 0,
      clickedCount: body.clickedCount ?? 0,
    });

    if (body.status === "queued") {
      processEmailCampaign(item._id.toString()).catch((err) => {
        console.error("Campaign processing error:", err);
      });
    }

    return apiSuccess(item, 201);
  } catch (error) {
    return apiError(error);
  }
}

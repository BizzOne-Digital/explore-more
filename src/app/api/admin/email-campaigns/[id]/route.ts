import connectDB from "@/lib/db";
import { EmailCampaign } from "@/models";
import { apiSuccess, apiError, notFound } from "@/lib/admin/api";
import { auth } from "@/lib/auth";
import { canEditCampaign } from "@/lib/email/campaign-utils";
import { processEmailCampaign } from "@/lib/email/process-campaign";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    await connectDB();
    const item = await EmailCampaign.findById(id).lean();
    if (!item) return notFound();
    return apiSuccess(item);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(new Error("Unauthorized"), 401);
    }

    const { id } = await params;
    await connectDB();
    const body = await request.json();

    const item = await EmailCampaign.findById(id);
    if (!item) return notFound();

    if (!canEditCampaign(item.status)) {
      return apiError(
        new Error(
          "This campaign has already been sent. Create a new campaign to send another message."
        ),
        400
      );
    }

    Object.assign(item, body);
    await item.save();

    if (body.status === "queued") {
      processEmailCampaign(item._id.toString()).catch((err) => {
        console.error("Campaign processing error:", err);
      });
    }

    return apiSuccess(item);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(new Error("Unauthorized"), 401);
    }

    const { id } = await params;
    await connectDB();
    const item = await EmailCampaign.findById(id);
    if (!item) return notFound();

    if (!canEditCampaign(item.status)) {
      return apiError(new Error("Cannot delete a sent campaign"), 400);
    }

    await item.deleteOne();
    return apiSuccess({ message: "Campaign deleted" });
  } catch (error) {
    return apiError(error);
  }
}

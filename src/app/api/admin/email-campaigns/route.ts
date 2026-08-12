import connectDB from "@/lib/db";
import { EmailCampaign } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { auth } from "@/lib/auth";

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
    const item = await EmailCampaign.create({
      ...body,
      createdBy: session.user.id,
      recipientCount: body.recipientCount ?? 0,
      sentCount: body.sentCount ?? 0,
      failedCount: body.failedCount ?? 0,
    });
    return apiSuccess(item, 201);
  } catch (error) {
    return apiError(error);
  }
}

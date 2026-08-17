import connectDB from "@/lib/db";
import { NewsletterSubscriber } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { auth } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(new Error("Unauthorized"), 401);
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const item = await NewsletterSubscriber.findByIdAndUpdate(
      id,
      {
        unsubscribed: body.unsubscribed ?? true,
        unsubscribedAt: body.unsubscribed ? new Date() : undefined,
      },
      { new: true }
    );

    if (!item) {
      return apiError(new Error("Subscriber not found"), 404);
    }

    return apiSuccess(item);
  } catch (error) {
    return apiError(error);
  }
}

import connectDB from "@/lib/db";
import { NewsletterSubscriber } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const item = await NewsletterSubscriber.findById(id).lean();
    if (!item) {
      return apiError(new Error("Subscriber not found"), 404);
    }

    return apiSuccess(item);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(
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
        email: body.email,
        name: body.name,
        verified: body.verified,
      },
      { new: true, runValidators: true }
    );

    if (!item) {
      return apiError(new Error("Subscriber not found"), 404);
    }

    return apiSuccess(item);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
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

    const item = await NewsletterSubscriber.findByIdAndDelete(id);
    if (!item) {
      return apiError(new Error("Subscriber not found"), 404);
    }

    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}

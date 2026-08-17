import connectDB from "@/lib/db";
import { EventRegistration } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { NextRequest } from "next/server";

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return apiError("Event ID is required");
    }

    const result = await EventRegistration.deleteMany({ eventId });
    return apiSuccess({ deletedCount: result.deletedCount });
  } catch (error) {
    return apiError(error);
  }
}

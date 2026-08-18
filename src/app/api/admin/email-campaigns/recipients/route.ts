import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/admin/api";
import {
  noRecipientsMessage,
  resolveNotificationRecipients,
  type BroadcastAudience,
} from "@/lib/notifications/recipients";

const BROADCAST_AUDIENCES: BroadcastAudience[] = [
  "all_parents",
  "portfolio_parents",
  "tutoring_parents",
];

function isBroadcastAudience(value: string | null): value is BroadcastAudience {
  return value != null && BROADCAST_AUDIENCES.includes(value as BroadcastAudience);
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const audience = request.nextUrl.searchParams.get("audience");
    if (!isBroadcastAudience(audience)) {
      return apiSuccess({ count: 0 });
    }

    const recipientIds = await resolveNotificationRecipients(audience);

    return apiSuccess({
      count: recipientIds.length,
      hint: recipientIds.length === 0 ? noRecipientsMessage(audience) : undefined,
    });
  } catch (error) {
    return apiError(error);
  }
}

import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { listActivePlans } from "@/lib/billing/parent-billing";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError(new Error("Unauthorized"), 401);

    await connectDB();
    const plans = await listActivePlans();
    return apiSuccess(plans);
  } catch (error) {
    return apiError(error);
  }
}

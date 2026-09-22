import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { getTrafficSummary, type TrafficPeriod } from "@/lib/analytics/traffic";

function parsePeriod(value: string | null): TrafficPeriod {
  if (value === "7" || value === "30" || value === "90") return Number(value) as TrafficPeriod;
  return 30;
}

export async function GET(request: Request) {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const period = parsePeriod(new URL(request.url).searchParams.get("days"));
    const summary = await getTrafficSummary(period);
    return apiSuccess(summary);
  } catch (error) {
    return apiError(error);
  }
}

import { jsonOk, jsonError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth-helpers";
import {
  MAX_PORTFOLIO_UPLOAD_SIZE,
  MAX_TUTOR_RESOURCE_UPLOAD_SIZE,
  VERCEL_SAFE_UPLOAD_SIZE,
} from "@/lib/constants";
import { isR2Configured } from "@/lib/services/r2-storage";

const UPLOAD_ROLES = new Set(["administrator", "instructor", "staff"]);

export async function GET() {
  const sessionResult = await requireSession();
  if ("error" in sessionResult) return sessionResult.error;

  if (!UPLOAD_ROLES.has(sessionResult.user.role)) {
    return jsonError("Forbidden", 403);
  }

  const largeUploadsEnabled = isR2Configured();
  const maxUploadBytes = Math.max(MAX_TUTOR_RESOURCE_UPLOAD_SIZE, MAX_PORTFOLIO_UPLOAD_SIZE);

  return jsonOk({
    largeUploadsEnabled,
    maxDirectUploadBytes: VERCEL_SAFE_UPLOAD_SIZE,
    maxUploadBytes,
    maxDirectUploadMb: VERCEL_SAFE_UPLOAD_SIZE / (1024 * 1024),
    maxUploadMb: maxUploadBytes / (1024 * 1024),
  });
}

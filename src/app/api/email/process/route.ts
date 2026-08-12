import { processEmailQueue, isSmtpConfigured } from "@/lib/services/email";
import { jsonOk, jsonError } from "@/lib/api/response";
import { verifyCronSecret } from "@/lib/api/auth-helpers";

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return jsonError("Unauthorized", 401);
  }

  if (!isSmtpConfigured()) {
    return jsonError("SMTP is not configured", 503);
  }

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);

  try {
    const result = await processEmailQueue(Math.min(limit, 100));
    return jsonOk(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Email processing failed";
    return jsonError(message, 500);
  }
}

export async function GET(request: Request) {
  return POST(request);
}

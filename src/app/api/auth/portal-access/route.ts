import { auth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  getPortalAccessForUser,
  type PortalType,
} from "@/lib/membership/portal-access";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Unauthorized", 401);
  }

  const portal = new URL(request.url).searchParams.get("portal");
  if (portal !== "parent" && portal !== "student") {
    return jsonError("Invalid portal", 400);
  }

  const result = await getPortalAccessForUser(
    session.user.id,
    session.user.role,
    portal as PortalType
  );

  return jsonOk(result);
}

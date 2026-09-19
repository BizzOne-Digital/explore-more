import { auth } from "@/lib/auth";
import { requireTutorPortal } from "@/lib/tutor/api-auth";

export type R2MultipartScope = "book-digital" | "tutor-resource";

export async function assertR2MultipartAccess(scope: R2MultipartScope): Promise<void> {
  if (scope === "book-digital") {
    const session = await auth();
    if (!session?.user || session.user.role !== "administrator") {
      throw new Error("Unauthorized");
    }
    return;
  }

  const sessionResult = await requireTutorPortal();
  if ("error" in sessionResult) {
    throw new Error("Unauthorized");
  }
}

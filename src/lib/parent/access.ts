import connectDB from "@/lib/db";
import { HomeschoolPortfolio } from "@/models";
import { getAccessibleStudentId } from "@/lib/auth/access";
import { jsonError } from "@/lib/api/response";
import type { SessionUser } from "@/types";

export async function requireParentStudentAccess(
  user: SessionUser,
  studentId?: string | null
): Promise<
  | { studentId: string; error?: never }
  | { studentId?: never; error: ReturnType<typeof jsonError> }
> {
  if (user.role !== "parent" && user.role !== "administrator") {
    return { error: jsonError("Forbidden", 403) };
  }

  const accessibleId = await getAccessibleStudentId(user, studentId ?? undefined);
  if (!accessibleId) {
    return { error: jsonError("Student not found or access denied", 403) };
  }
  return { studentId: accessibleId };
}

export async function requirePortfolioAccess(
  user: SessionUser,
  portfolioId: string
): Promise<
  | { portfolio: InstanceType<typeof HomeschoolPortfolio>; error?: never }
  | { portfolio?: never; error: ReturnType<typeof jsonError> }
> {
  await connectDB();
  const portfolio = await HomeschoolPortfolio.findById(portfolioId);
  if (!portfolio) {
    return { error: jsonError("Portfolio not found", 404) };
  }

  if (user.role === "administrator") {
    return { portfolio };
  }

  if (user.role === "parent" && portfolio.guardianId.toString() === user.id) {
    return { portfolio };
  }

  return { error: jsonError("Forbidden", 403) };
}

import connectDB from "@/lib/db";
import { requireSession, requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { getOrCreatePortfolio, getPortfolioStats, computePortfolioReadiness, canSubmitPortfolio } from "@/lib/queries/portfolio";
import { requireParentStudentAccess } from "@/lib/parent/access";
import { getSchoolYearOptions } from "@/lib/portfolio/constants";
import { GuardianStudentLink, User } from "@/models";

export async function GET(request: Request) {
  try {
    const sessionResult = await requireRole(["parent", "administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const { searchParams } = new URL(request.url);
    const studentIdParam = searchParams.get("studentId");
    const schoolYear = searchParams.get("schoolYear") ?? getSchoolYearOptions()[0];

    const access = await requireParentStudentAccess(sessionResult.user, studentIdParam);
    if ("error" in access) return access.error;

    const portfolio = await getOrCreatePortfolio(
      access.studentId,
      sessionResult.user.role === "parent"
        ? sessionResult.user.id
        : await portfolioGuardianFallback(access.studentId),
      schoolYear
    );

    const stats = await getPortfolioStats(portfolio._id.toString());
    const readiness = computePortfolioReadiness(stats);

    await connectDB();
    const student = await User.findById(access.studentId).select("name email");

    return apiSuccess({
      portfolio,
      student,
      stats,
      readiness,
      canSubmit: canSubmitPortfolio(stats) && portfolio.status === "draft",
      schoolYear,
    });
  } catch (error) {
    return apiError(error);
  }
}

async function portfolioGuardianFallback(studentId: string): Promise<string> {
  await connectDB();
  const link = await GuardianStudentLink.findOne({ studentId, status: "approved" });
  return link?.guardianId.toString() ?? studentId;
}

import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { requireParentStudentAccess, requirePortfolioAccess } from "@/lib/parent/access";
import { getOrCreatePortfolio } from "@/lib/queries/portfolio";
import { getSchoolYearOptions } from "@/lib/portfolio/constants";
import { PortfolioAttendance } from "@/models";

export async function GET(request: Request) {
  try {
    const sessionResult = await requireRole(["parent", "administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const portfolioId = new URL(request.url).searchParams.get("portfolioId");
    if (!portfolioId) return apiError(new Error("portfolioId is required"), 400);

    const access = await requirePortfolioAccess(sessionResult.user, portfolioId);
    if ("error" in access) return access.error;

    const records = await PortfolioAttendance.find({ portfolioId }).sort({ date: -1 });
    return apiSuccess(records);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    const body = await request.json();
    const { studentId, schoolYear, date, type, notes } = body;

    if (!studentId || !date || !type) {
      return apiError(new Error("studentId, date, and type are required"), 400);
    }

    const studentAccess = await requireParentStudentAccess(sessionResult.user, studentId);
    if ("error" in studentAccess) return studentAccess.error;

    const portfolio = await getOrCreatePortfolio(
      studentAccess.studentId,
      sessionResult.user.id,
      schoolYear || getSchoolYearOptions()[0]
    );

    const record = await PortfolioAttendance.findOneAndUpdate(
      { portfolioId: portfolio._id, date: new Date(date) },
      {
        portfolioId: portfolio._id,
        studentId: studentAccess.studentId,
        date: new Date(date),
        type,
        notes,
      },
      { upsert: true, new: true }
    );

    return apiSuccess(record, 201);
  } catch (error) {
    return apiError(error);
  }
}

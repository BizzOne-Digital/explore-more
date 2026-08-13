import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { requirePortfolioAccess } from "@/lib/parent/access";
import { getOrCreatePortfolio } from "@/lib/queries/portfolio";
import { getSchoolYearOptions } from "@/lib/portfolio/constants";
import { PortfolioReadingEntry } from "@/models";
import { requireParentStudentAccess } from "@/lib/parent/access";

export async function GET(request: Request) {
  try {
    const sessionResult = await requireRole(["parent", "administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const portfolioId = new URL(request.url).searchParams.get("portfolioId");
    if (!portfolioId) return apiError(new Error("portfolioId is required"), 400);

    const access = await requirePortfolioAccess(sessionResult.user, portfolioId);
    if ("error" in access) return access.error;

    const entries = await PortfolioReadingEntry.find({ portfolioId }).sort({ dateCompleted: -1 });
    return apiSuccess(entries);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    const body = await request.json();
    const { studentId, schoolYear, bookTitle, author, subject, dateStarted, dateCompleted, resourceType, notes } = body;

    if (!studentId || !bookTitle) {
      return apiError(new Error("studentId and bookTitle are required"), 400);
    }

    const studentAccess = await requireParentStudentAccess(sessionResult.user, studentId);
    if ("error" in studentAccess) return studentAccess.error;

    const portfolio = await getOrCreatePortfolio(
      studentAccess.studentId,
      sessionResult.user.id,
      schoolYear || getSchoolYearOptions()[0]
    );

    const entry = await PortfolioReadingEntry.create({
      portfolioId: portfolio._id,
      studentId: studentAccess.studentId,
      bookTitle,
      author,
      subject,
      dateStarted: dateStarted ? new Date(dateStarted) : undefined,
      dateCompleted: dateCompleted ? new Date(dateCompleted) : undefined,
      resourceType: resourceType || "book",
      notes,
    });

    return apiSuccess(entry, 201);
  } catch (error) {
    return apiError(error);
  }
}

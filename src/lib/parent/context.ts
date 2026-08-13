import { getSchoolYearOptions } from "@/lib/portfolio/constants";
import { getLinkedStudents } from "@/lib/parent/students";
import { getOrCreatePortfolio, getPortfolioStats, computePortfolioReadiness, canSubmitPortfolio } from "@/lib/queries/portfolio";

export async function resolveParentContext(
  guardianId: string,
  searchParams: { student?: string; year?: string }
) {
  const students = await getLinkedStudents(guardianId);
  const defaultYear = getSchoolYearOptions()[0];
  const studentId = searchParams.student && students.some((s) => s.id === searchParams.student)
    ? searchParams.student
    : students[0]?.id;
  const schoolYear = searchParams.year ?? defaultYear;

  if (!studentId) {
    return { students, studentId: null, schoolYear, portfolio: null, stats: null, readiness: null, canSubmit: false };
  }

  const portfolio = await getOrCreatePortfolio(studentId, guardianId, schoolYear);
  const stats = await getPortfolioStats(portfolio._id.toString());
  const readiness = computePortfolioReadiness(stats);

  return {
    students,
    studentId,
    schoolYear,
    portfolio,
    stats,
    readiness,
    canSubmit: canSubmitPortfolio(stats) && portfolio.status === "draft",
  };
}

import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { requireParentStudentAccess, requirePortfolioAccess } from "@/lib/parent/access";
import { getOrCreatePortfolio } from "@/lib/queries/portfolio";
import { getSchoolYearOptions } from "@/lib/portfolio/constants";
import { PortfolioWorkSample } from "@/models";
import { uploadPortfolioFiles } from "@/lib/services/upload";
import type { PortfolioSubject, ProgressMarker } from "@/lib/portfolio/constants";

export async function GET(request: Request) {
  try {
    const sessionResult = await requireRole(["parent", "administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get("portfolioId");
    if (!portfolioId) return apiError(new Error("portfolioId is required"), 400);

    const access = await requirePortfolioAccess(sessionResult.user, portfolioId);
    if ("error" in access) return access.error;

    const samples = await PortfolioWorkSample.find({ portfolioId }).sort({ dateCompleted: -1 });
    return apiSuccess(samples);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    const formData = await request.formData();
    const studentId = formData.get("studentId") as string;
    const schoolYear = (formData.get("schoolYear") as string) || getSchoolYearOptions()[0];
    const subject = formData.get("subject") as string;
    const assignmentName = formData.get("assignmentName") as string;
    const dateCompleted = formData.get("dateCompleted") as string;
    const description = (formData.get("description") as string) || undefined;
    const progressMarker = (formData.get("progressMarker") as string) || "none";

    if (!studentId || !subject || !assignmentName || !dateCompleted) {
      return apiError(new Error("Missing required fields"), 400);
    }

    const studentAccess = await requireParentStudentAccess(sessionResult.user, studentId);
    if ("error" in studentAccess) return studentAccess.error;

    const portfolio = await getOrCreatePortfolio(
      studentAccess.studentId,
      sessionResult.user.id,
      schoolYear
    );

    const fileEntries = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    const uploaded = fileEntries.length > 0 ? await uploadPortfolioFiles(fileEntries) : [];

    const sample = await PortfolioWorkSample.create({
      portfolioId: portfolio._id,
      studentId: studentAccess.studentId,
      subject: subject as PortfolioSubject,
      assignmentName,
      dateCompleted: new Date(dateCompleted),
      description,
      progressMarker: progressMarker as ProgressMarker,
      files: uploaded,
    });

    return apiSuccess(sample, 201);
  } catch (error) {
    return apiError(error);
  }
}

import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { requireParentStudentAccess, requirePortfolioAccess } from "@/lib/parent/access";
import { getOrCreatePortfolio } from "@/lib/queries/portfolio";
import { getSchoolYearOptions } from "@/lib/portfolio/constants";
import { PortfolioCurriculum } from "@/models";
import { uploadPortfolioFiles } from "@/lib/services/upload";
import type { PortfolioSubject } from "@/lib/portfolio/constants";

export async function GET(request: Request) {
  try {
    const sessionResult = await requireRole(["parent", "administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const portfolioId = new URL(request.url).searchParams.get("portfolioId");
    if (!portfolioId) return apiError(new Error("portfolioId is required"), 400);

    const access = await requirePortfolioAccess(sessionResult.user, portfolioId);
    if ("error" in access) return access.error;

    const items = await PortfolioCurriculum.find({ portfolioId }).sort({ subject: 1 });
    return apiSuccess(items);
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
    const materialName = formData.get("materialName") as string;
    const description = (formData.get("description") as string) || undefined;

    if (!studentId || !subject || !materialName) {
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

    const item = await PortfolioCurriculum.create({
      portfolioId: portfolio._id,
      studentId: studentAccess.studentId,
      subject: subject as PortfolioSubject,
      materialName,
      description,
      files: uploaded,
    });

    return apiSuccess(item, 201);
  } catch (error) {
    return apiError(error);
  }
}

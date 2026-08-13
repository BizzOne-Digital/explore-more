import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { requireParentStudentAccess, requirePortfolioAccess } from "@/lib/parent/access";
import { getOrCreatePortfolio } from "@/lib/queries/portfolio";
import { getSchoolYearOptions } from "@/lib/portfolio/constants";
import { PortfolioActivity } from "@/models";
import { uploadPortfolioFiles } from "@/lib/services/upload";
import type { ActivityCategory } from "@/lib/portfolio/constants";

export async function GET(request: Request) {
  try {
    const sessionResult = await requireRole(["parent", "administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const portfolioId = new URL(request.url).searchParams.get("portfolioId");
    if (!portfolioId) return apiError(new Error("portfolioId is required"), 400);

    const access = await requirePortfolioAccess(sessionResult.user, portfolioId);
    if ("error" in access) return access.error;

    const activities = await PortfolioActivity.find({ portfolioId }).sort({ date: -1 });
    return apiSuccess(activities);
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
    const category = formData.get("category") as string;
    const activityName = formData.get("activityName") as string;
    const date = formData.get("date") as string;
    const subject = (formData.get("subject") as string) || undefined;
    const location = (formData.get("location") as string) || undefined;
    const learned = (formData.get("learned") as string) || undefined;
    const hours = formData.get("hours") ? Number(formData.get("hours")) : undefined;

    if (!studentId || !category || !activityName || !date) {
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

    const activity = await PortfolioActivity.create({
      portfolioId: portfolio._id,
      studentId: studentAccess.studentId,
      category: category as ActivityCategory,
      activityName,
      date: new Date(date),
      subject,
      location,
      learned,
      hours,
      files: uploaded,
    });

    return apiSuccess(activity, 201);
  } catch (error) {
    return apiError(error);
  }
}

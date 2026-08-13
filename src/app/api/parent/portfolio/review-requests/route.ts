import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { requirePortfolioAccess } from "@/lib/parent/access";
import { PortfolioReviewRequest } from "@/models";
import { uploadPortfolioFiles } from "@/lib/services/upload";

export async function GET(request: Request) {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    const portfolioId = new URL(request.url).searchParams.get("portfolioId");
    if (!portfolioId) return apiError(new Error("portfolioId is required"), 400);

    const access = await requirePortfolioAccess(sessionResult.user, portfolioId);
    if ("error" in access) return access.error;

    await connectDB();
    const requests = await PortfolioReviewRequest.find({ portfolioId })
      .populate("requestedBy", "name")
      .sort({ createdAt: -1 });

    return apiSuccess(requests);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    const formData = await request.formData();
    const requestId = formData.get("requestId") as string;
    const responseNote = (formData.get("responseNote") as string) || undefined;

    if (!requestId) return apiError(new Error("requestId is required"), 400);

    await connectDB();
    const reviewRequest = await PortfolioReviewRequest.findById(requestId);
    if (!reviewRequest) return apiError(new Error("Request not found"), 404);

    const access = await requirePortfolioAccess(
      sessionResult.user,
      reviewRequest.portfolioId.toString()
    );
    if ("error" in access) return access.error;

    const fileEntries = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    const uploaded = fileEntries.length > 0 ? await uploadPortfolioFiles(fileEntries) : [];

    reviewRequest.responseFiles.push(...uploaded);
    reviewRequest.responseNote = responseNote;
    reviewRequest.status = "fulfilled";
    reviewRequest.fulfilledAt = new Date();
    await reviewRequest.save();

    if (access.portfolio.status === "additional_docs_requested") {
      access.portfolio.status = "under_review";
      await access.portfolio.save();
    }

    return apiSuccess(reviewRequest);
  } catch (error) {
    return apiError(error);
  }
}

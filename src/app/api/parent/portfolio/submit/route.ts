import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { requirePortfolioAccess } from "@/lib/parent/access";
import { canSubmitPortfolio, getPortfolioStats } from "@/lib/queries/portfolio";
import connectDB from "@/lib/db";

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    const { portfolioId } = await request.json();
    if (!portfolioId) return apiError(new Error("portfolioId is required"), 400);

    const access = await requirePortfolioAccess(sessionResult.user, portfolioId);
    if ("error" in access) return access.error;

    const { portfolio } = access;
    if (portfolio.status !== "draft" && portfolio.status !== "additional_docs_requested") {
      return apiError(new Error("Portfolio cannot be submitted in its current status"), 400);
    }

    const stats = await getPortfolioStats(portfolio._id.toString());
    if (!canSubmitPortfolio(stats)) {
      return apiError(
        new Error("Please complete more portfolio sections before submitting. Aim for at least 60% readiness."),
        400
      );
    }

    await connectDB();
    portfolio.status = "submitted";
    portfolio.submittedAt = new Date();
    await portfolio.save();

    return apiSuccess({ portfolio });
  } catch (error) {
    return apiError(error);
  }
}

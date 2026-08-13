import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { HomeschoolPortfolio, PortfolioReviewRequest, User } from "@/models";

export async function GET() {
  try {
    const sessionResult = await requireRole(["administrator", "instructor"]);
    if ("error" in sessionResult) return sessionResult.error;

    await connectDB();
    const portfolios = await HomeschoolPortfolio.find({
      status: { $in: ["submitted", "under_review", "additional_docs_requested", "completed"] },
    })
      .populate("studentId", "name email")
      .populate("guardianId", "name email")
      .sort({ submittedAt: -1 });

    return apiSuccess(portfolios);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const sessionResult = await requireRole(["administrator", "instructor"]);
    if ("error" in sessionResult) return sessionResult.error;

    const { portfolioId, status, reviewerNotes, reviewRequest } = await request.json();
    if (!portfolioId) return apiError(new Error("portfolioId is required"), 400);

    await connectDB();
    const portfolio = await HomeschoolPortfolio.findById(portfolioId);
    if (!portfolio) return apiError(new Error("Portfolio not found"), 404);

    if (status) portfolio.status = status;
    if (reviewerNotes) portfolio.reviewerNotes = reviewerNotes;
    if (status === "completed") {
      portfolio.reviewCompletedAt = new Date();
      portfolio.reviewedBy = sessionResult.user.id as unknown as typeof portfolio.reviewedBy;
    }
    if (status === "under_review" && !portfolio.reviewedBy) {
      portfolio.reviewedBy = sessionResult.user.id as unknown as typeof portfolio.reviewedBy;
    }
    await portfolio.save();

    if (reviewRequest?.message) {
      await PortfolioReviewRequest.create({
        portfolioId: portfolio._id,
        studentId: portfolio.studentId,
        subject: reviewRequest.subject,
        message: reviewRequest.message,
        status: "open",
        requestedBy: sessionResult.user.id,
      });
      portfolio.status = "additional_docs_requested";
      await portfolio.save();
    }

    return apiSuccess(portfolio);
  } catch (error) {
    return apiError(error);
  }
}

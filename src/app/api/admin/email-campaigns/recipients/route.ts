import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const audience = searchParams.get("audience");

    let count = 0;

    switch (audience) {
      case "all_parents":
        count = await User.countDocuments({ role: "parent", isActive: true });
        break;

      case "portfolio_parents":
        // Parents with portfolio access
        try {
          const { HomeschoolPortfolio } = await import("@/models/Portfolio");
          const portfolios = await HomeschoolPortfolio.find().distinct("parentId");
          count = portfolios.length;
        } catch (err) {
          // Portfolio model might not exist
          count = 0;
        }
        break;

      case "tutoring_parents":
        // Parents with tutoring enrollments
        try {
          const { Enrollment } = await import("@/models");
          const enrollments = await Enrollment.find().distinct("userId");
          const parents = await User.find({
            _id: { $in: enrollments },
            role: "parent",
            isActive: true,
          });
          count = parents.length;
        } catch (err) {
          // Fallback to all parents
          count = await User.countDocuments({ role: "parent", isActive: true });
        }
        break;

      default:
        count = 0;
    }

    return apiSuccess({ count });
  } catch (error) {
    return apiError(error);
  }
}

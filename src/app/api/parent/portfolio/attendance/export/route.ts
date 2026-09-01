import { requireRole } from "@/lib/api/auth-helpers";
import { requirePortfolioAccess } from "@/lib/parent/access";
import { apiError } from "@/lib/admin/api";
import {
  generateInstructionLogReportPdf,
  getInstructionLogReportData,
} from "@/lib/pdf/instruction-log-report";

export async function GET(request: Request) {
  try {
    const sessionResult = await requireRole(["parent", "administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const portfolioId = new URL(request.url).searchParams.get("portfolioId");
    if (!portfolioId) return apiError(new Error("portfolioId is required"), 400);

    const access = await requirePortfolioAccess(sessionResult.user, portfolioId);
    if ("error" in access) return access.error;

    const data = await getInstructionLogReportData(portfolioId);
    if (!data) return apiError(new Error("Portfolio not found"), 404);

    const pdf = await generateInstructionLogReportPdf(data);
    const filename = `instruction-log-${data.schoolYear.replace(/[^\d-]/g, "")}-${data.studentName.replace(/[^\w.-]+/g, "_")}.pdf`;

    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

import { requireRole } from "@/lib/api/auth-helpers";
import { apiError } from "@/lib/admin/api";
import { getAccessibleStudentId } from "@/lib/auth/access";
import { generateAttendanceReportPdf, getAttendanceReportData } from "@/lib/pdf/attendance-report";
import { endOfMonth, format, startOfMonth } from "date-fns";

export async function GET(request: Request) {
  try {
    const sessionResult = await requireRole(["parent", "administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const month = searchParams.get("month") || format(new Date(), "yyyy-MM");

    if (!studentId) return apiError(new Error("studentId is required"), 400);

    const accessibleId = await getAccessibleStudentId(sessionResult.user, studentId);
    if (!accessibleId) return apiError(new Error("Access denied"), 403);

    const currentDate = new Date(`${month}-01`);
    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);

    const data = await getAttendanceReportData(accessibleId, startDate, endDate);
    if (!data) return apiError(new Error("Student not found"), 404);

    const periodLabel = format(currentDate, "MMMM yyyy");
    const pdf = await generateAttendanceReportPdf(data, periodLabel);
    const filename = `attendance-${month}-${data.studentName.replace(/[^\w.-]+/g, "_")}.pdf`;

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

import connectDB from "@/lib/db";
import { Certificate, GuardianStudentLink } from "@/models";
import { apiSuccess, apiError, notFound, isValidObjectId } from "@/lib/admin/api";
import { auth } from "@/lib/auth";
import { publishCertificateToStudent } from "@/lib/certificates/publish";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(new Error("Unauthorized"), 401);
    }

    const { id } = await params;
    if (!isValidObjectId(id)) return notFound();

    await connectDB();

    const certificate = await Certificate.findById(id).populate("studentId").lean();
    if (!certificate) return notFound();

    const guardianLink = await GuardianStudentLink.findOne({
      studentId: certificate.studentId,
      status: "approved",
    }).populate("guardianId").lean();

    if (!guardianLink?.guardianId) {
      return apiError(new Error("No parent/guardian account is linked to this student."), 400);
    }

    const result = await publishCertificateToStudent(id, session.user.id);

    return apiSuccess({ sent: result.notificationSent, ...result });
  } catch (error) {
    return apiError(error);
  }
}

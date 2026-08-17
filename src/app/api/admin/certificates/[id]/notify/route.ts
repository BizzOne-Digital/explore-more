import connectDB from "@/lib/db";
import { Certificate, GuardianStudentLink } from "@/models";
import { apiSuccess, apiError, notFound, isValidObjectId } from "@/lib/admin/api";
import { sendCertificateNotification } from "@/lib/email/templates/certificate-notification";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return notFound();
    
    await connectDB();
    
    const certificate = await Certificate.findById(id)
      .populate("studentId")
      .lean();
    if (!certificate) return notFound();

    // Find approved guardian link
    const guardianLink = await GuardianStudentLink.findOne({
      studentId: certificate.studentId,
      status: "approved",
    }).populate("guardianId").lean();
    
    if (!guardianLink || !guardianLink.guardianId) {
      return apiError("No parent/guardian account is linked to this student.");
    }

    // Send notification
    await sendCertificateNotification({
      guardian: guardianLink.guardianId as unknown as { name: string; email: string },
      student: certificate.studentId as unknown as { name: string; studentId?: string },
      certificate: certificate as unknown as {
        title: string;
        description?: string;
        issueDate: Date;
        filePath: string;
        fileType: string;
      },
    });

    // Update certificate
    await Certificate.findByIdAndUpdate(id, {
      notificationSent: true,
      notificationSentAt: new Date(),
    });

    return apiSuccess({ sent: true });
  } catch (error) {
    return apiError(error);
  }
}

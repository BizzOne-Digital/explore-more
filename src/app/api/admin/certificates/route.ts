import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Certificate, GuardianStudentLink } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { auth } from "@/lib/auth";
import { sendCertificateNotification } from "@/lib/email/templates/certificate-notification";

export async function GET() {
  try {
    await connectDB();
    const items = await Certificate.find()
      .populate("studentId", "name studentId")
      .sort({ createdAt: -1 })
      .lean();
    return apiSuccess(items);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(new Error("Unauthorized"), 401);
    }

    await connectDB();
    const body = await request.json();

    const certificate = await Certificate.create({
      ...body,
      issuedBy: session.user.id,
      notificationSent: false,
    });

    try {
      const guardianLink = await GuardianStudentLink.findOne({
        studentId: body.studentId,
        status: "approved",
      }).populate("guardianId").populate("studentId").lean();

      if (guardianLink && guardianLink.guardianId) {
        await sendCertificateNotification({
          guardian: guardianLink.guardianId as unknown as { name: string; email: string },
          student: guardianLink.studentId as unknown as { name: string; studentId?: string },
          certificate: certificate.toObject() as unknown as {
            title: string;
            description?: string;
            issueDate: Date;
            filePath: string;
            fileType: string;
          },
        });

        await Certificate.findByIdAndUpdate(certificate._id, {
          notificationSent: true,
          notificationSentAt: new Date(),
        });
      }
    } catch (notifyError) {
      console.error("Failed to send certificate notification:", notifyError);
    }

    return apiSuccess(certificate, 201);
  } catch (error) {
    return apiError(error);
  }
}

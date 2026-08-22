import connectDB from "@/lib/db";
import { Certificate } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { publishCertificateToStudent } from "@/lib/certificates/publish";
import {
  clearCertificateAssociationFields,
  resolveCertificateAssociations,
} from "@/lib/certificates/associations";

const certificateSchema = z.object({
  studentId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  issueDate: z.union([z.string(), z.date()]),
  courseId: z.string().optional(),
  programId: z.string().optional(),
  eventId: z.string().optional(),
  filePath: z.string().min(1),
  fileType: z.enum(["image", "pdf"]),
  isShareable: z.boolean().optional(),
  publishToStudent: z.boolean().optional(),
});

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
    const data = certificateSchema.parse(body);

    const associations = await resolveCertificateAssociations({
      courseId: data.courseId || undefined,
      programId: data.programId || undefined,
      eventId: data.eventId || undefined,
    });

    const certificate = await Certificate.create({
      studentId: data.studentId,
      title: data.title,
      description: data.description,
      ...associations,
      issueDate: new Date(data.issueDate),
      filePath: data.filePath,
      fileType: data.fileType,
      isShareable: data.isShareable ?? false,
      publishedToStudent: false,
      notificationSent: false,
      issuedBy: session.user.id,
    });

    let publishResult = null;
    if (data.publishToStudent) {
      publishResult = await publishCertificateToStudent(
        certificate._id.toString(),
        session.user.id
      );
    }

    return apiSuccess(
      {
        certificate,
        publish: publishResult,
      },
      201
    );
  } catch (error) {
    return apiError(error);
  }
}

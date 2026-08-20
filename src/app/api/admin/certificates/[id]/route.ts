import connectDB from "@/lib/db";
import { Certificate } from "@/models";
import { apiSuccess, apiError, notFound, isValidObjectId } from "@/lib/admin/api";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { publishCertificateToStudent } from "@/lib/certificates/publish";

const updateSchema = z.object({
  studentId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  issueDate: z.union([z.string(), z.date()]).optional(),
  associatedCourse: z.string().optional(),
  associatedProgram: z.string().optional(),
  associatedEvent: z.string().optional(),
  filePath: z.string().min(1).optional(),
  fileType: z.enum(["image", "pdf"]).optional(),
  isShareable: z.boolean().optional(),
  publishToStudent: z.boolean().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return notFound();

    await connectDB();
    const item = await Certificate.findById(id).lean();
    if (!item) return notFound();
    return apiSuccess(item);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(new Error("Unauthorized"), 401);
    }

    const { id } = await params;
    if (!isValidObjectId(id)) return notFound();

    await connectDB();
    const body = await request.json();
    const data = updateSchema.parse(body);

    const update: Record<string, unknown> = { ...data };
    if (data.issueDate) update.issueDate = new Date(data.issueDate);
    delete update.publishToStudent;

    const item = await Certificate.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!item) return notFound();

    let publishResult = null;
    if (data.publishToStudent) {
      publishResult = await publishCertificateToStudent(id, session.user.id);
    }

    return apiSuccess({ certificate: item, publish: publishResult });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return notFound();

    await connectDB();
    const item = await Certificate.findByIdAndDelete(id);
    if (!item) return notFound();
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}

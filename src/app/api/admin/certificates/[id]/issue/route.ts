import connectDB from "@/lib/db";
import { apiSuccess, apiError, notFound, isValidObjectId } from "@/lib/admin/api";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { issueCertificateToStudents } from "@/lib/certificates/publish";

const schema = z.object({
  studentIds: z.array(z.string().min(1)).min(1),
  publish: z.boolean().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(new Error("Unauthorized"), 401);
    }

    const { id } = await params;
    if (!isValidObjectId(id)) return notFound();

    const body = await request.json();
    const data = schema.parse(body);

    await connectDB();
    const results = await issueCertificateToStudents(
      id,
      data.studentIds,
      session.user.id,
      data.publish ?? true
    );

    return apiSuccess({ results });
  } catch (error) {
    return apiError(error);
  }
}

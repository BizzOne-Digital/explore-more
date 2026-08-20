import connectDB from "@/lib/db";
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
    const result = await publishCertificateToStudent(id, session.user.id);

    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}

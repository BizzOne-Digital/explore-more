import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { Sponsor, SponsorNote, User } from "@/models";
import { apiSuccess, apiError, isValidObjectId } from "@/lib/admin/api";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(new Error("Invalid sponsor id"), 400);

    await connectDB();
    const notes = await SponsorNote.find({ sponsorId: id }).sort({ createdAt: -1 }).lean();
    return apiSuccess(notes);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError(new Error("Unauthorized"), 401);

    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(new Error("Invalid sponsor id"), 400);

    await connectDB();
    const sponsor = await Sponsor.findById(id);
    if (!sponsor) return apiError(new Error("Sponsor not found"), 404);

    const body = await request.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) return apiError(new Error("Note content is required"), 400);

    const staff = await User.findById(session.user.id).select("name staffId").lean();
    const subject =
      (typeof body.subject === "string" && body.subject.trim()) || "Sponsor interaction";

    const note = await SponsorNote.create({
      sponsorId: id,
      createdBy: session.user.id,
      staffName: staff?.name ?? "Admin",
      type: body.type ?? "note",
      subject,
      content,
      followUpDate: body.followUpDate ? new Date(body.followUpDate) : undefined,
      followUpCompleted: !!body.followUpCompleted,
    });

    if (body.followUpDate && !body.followUpCompleted) {
      sponsor.nextFollowUpAt = new Date(body.followUpDate);
      await sponsor.save();
    }

    return apiSuccess(note, 201);
  } catch (error) {
    return apiError(error);
  }
}

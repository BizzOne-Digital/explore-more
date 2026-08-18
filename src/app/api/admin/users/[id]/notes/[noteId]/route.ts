import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, isValidObjectId } from "@/lib/admin/api";
import { AccountNote, User } from "@/models";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/admin/audit-log";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError(new Error("Unauthorized"), 401);

    await connectDB();
    const { id, noteId } = await params;

    if (!isValidObjectId(id) || !isValidObjectId(noteId)) {
      return apiError(new Error("Invalid id"), 400);
    }

    const note = await AccountNote.findOne({ _id: noteId, accountId: id, isDeleted: false }).lean();
    if (!note) return apiError(new Error("Note not found"), 404);

    return apiSuccess(note);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError(new Error("Unauthorized"), 401);

    await connectDB();
    const { id, noteId } = await params;

    if (!isValidObjectId(id) || !isValidObjectId(noteId)) {
      return apiError(new Error("Invalid id"), 400);
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return apiError(new Error("Invalid request body"), 400);
    }

    const note = await AccountNote.findOne({ _id: noteId, accountId: id, isDeleted: false });
    if (!note) return apiError(new Error("Note not found"), 404);

    const staff = await User.findById(session.user.id).select("name").lean();

    if (typeof body.subject === "string") note.subject = body.subject.trim();
    if (typeof body.reasonForCall === "string") note.reasonForCall = body.reasonForCall.trim();
    if (typeof body.noteContent === "string") {
      const content = body.noteContent.trim();
      if (!content) return apiError(new Error("Note content cannot be empty"), 400);
      note.noteContent = content;
    }
    if (typeof body.callerName === "string") note.callerName = body.callerName.trim();
    if (body.followUpNeeded !== undefined) note.followUpNeeded = Boolean(body.followUpNeeded);
    if (body.followUpDate !== undefined) {
      note.followUpDate = body.followUpDate ? new Date(String(body.followUpDate)) : undefined;
    }
    if (body.isVisibleToParent !== undefined) {
      note.isVisibleToParent = Boolean(body.isVisibleToParent);
    }

    note.isEdited = true;
    note.editedBy = session.user.id as unknown as typeof note.editedBy;
    note.editedAt = new Date();
    await note.save();

    await logActivity({
      performedBy: session.user.id,
      action: "update",
      entity: "account_note",
      entityId: note._id.toString(),
      userId: id,
      details: `${staff?.name ?? "Staff"} edited account note: ${note.subject}`,
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return apiSuccess(note);
  } catch (error) {
    return apiError(error);
  }
}

import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, isValidObjectId } from "@/lib/admin/api";
import { AccountNote, User } from "@/models";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/admin/audit-log";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError(new Error("Unauthorized"), 401);

    await connectDB();
    const { id } = await params;

    if (!isValidObjectId(id)) return apiError(new Error("Invalid account id"), 400);

    const account = await User.findById(id).select("_id").lean();
    if (!account) return apiError(new Error("Account not found"), 404);

    const notes = await AccountNote.find({ accountId: id, isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();

    return apiSuccess(notes);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError(new Error("Unauthorized"), 401);

    await connectDB();
    const { id } = await params;

    if (!isValidObjectId(id)) return apiError(new Error("Invalid account id"), 400);

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return apiError(new Error("Invalid request body"), 400);
    }

    const account = await User.findById(id).lean();
    if (!account) return apiError(new Error("Account not found"), 404);

    if (!["parent", "student"].includes(account.role)) {
      return apiError(new Error("Notes are only supported for parent and student accounts"), 400);
    }

    const staff = await User.findById(session.user.id).select("name staffId").lean();
    if (!staff) return apiError(new Error("Staff user not found"), 404);

    const noteContent = typeof body.noteContent === "string" ? body.noteContent.trim() : "";
    if (!noteContent) {
      return apiError(new Error("Note content is required"), 400);
    }

    const accountType = account.role === "student" ? "student" : "parent";

    const note = await AccountNote.create({
      accountId: id,
      accountType,
      createdBy: session.user.id,
      staffName: staff.name,
      staffId: staff.staffId ?? "STAFF",
      callerName:
        (typeof body.callerName === "string" && body.callerName.trim()) || account.name,
      subject: (typeof body.subject === "string" && body.subject.trim()) || "General",
      reasonForCall:
        (typeof body.reasonForCall === "string" && body.reasonForCall.trim()) ||
        (typeof body.category === "string" && body.category.trim()) ||
        "General",
      noteContent,
      followUpNeeded: !!body.followUpNeeded,
      followUpDate: body.followUpDate ? new Date(String(body.followUpDate)) : undefined,
      isVisibleToParent: !!body.isVisibleToParent,
    });

    await logActivity({
      performedBy: session.user.id,
      action: "create",
      entity: "account_note",
      entityId: note._id.toString(),
      userId: id,
      details: `${staff.name} added an account note: ${note.subject}`,
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return apiSuccess(note);
  } catch (error) {
    return apiError(error);
  }
}

import connectDB from "@/lib/db";
import { Message, User } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(new Error("Unauthorized"), 401);
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all"; // all, sent, received, unread

    const query: Record<string, unknown> = {};

    // Apply filters
    if (filter === "sent") {
      query.senderId = session.user.id;
    } else if (filter === "received") {
      query.recipientId = session.user.id;
    } else if (filter === "unread") {
      query.recipientId = session.user.id;
      query.read = false;
    } else {
      // All messages (sent or received)
      query.$or = [
        { senderId: session.user.id },
        { recipientId: session.user.id },
      ];
    }

    // Apply search
    if (search) {
      query.$and = query.$and || [];
      (query.$and as Record<string, unknown>[]).push({
        $or: [
          { subject: { $regex: search, $options: "i" } },
          { body: { $regex: search, $options: "i" } },
        ],
      });
    }

    const messages = await Message.find(query)
      .populate("senderId", "name email role studentId")
      .populate("recipientId", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    return apiSuccess(messages);
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

    const {
      recipientType,
      recipientId,
      recipientGroup,
      subject,
      message: bodyText,
      replyToId,
    } = body;

    // Get recipients based on type
    let recipientIds: string[] = [];

    if (recipientType === "individual") {
      recipientIds = [recipientId];
    } else if (recipientType === "group") {
      // Get all users in the group
      let roleFilter: Array<"parent" | "administrator" | "instructor"> = [];

      if (recipientGroup === "all_parents") {
        roleFilter = ["parent"];
      } else if (recipientGroup === "all_staff") {
        roleFilter = ["administrator"];
      } else if (recipientGroup === "all_tutors") {
        roleFilter = ["instructor"];
      }

      const users = await User.find({
        role: { $in: roleFilter },
        isActive: true,
      }).select("_id");
      
      recipientIds = users.map((u) => u._id.toString());
    }

    // Create messages for each recipient
    const messages = await Promise.all(
      recipientIds.map((recId) =>
        Message.create({
          recipientId: recId,
          senderId: session.user.id,
          subject,
          body: bodyText,
          recipientType,
          recipientGroup: recipientType === "group" ? recipientGroup : undefined,
          replyToId: replyToId || undefined,
        })
      )
    );

    // If this is a reply, update the parent message
    if (replyToId) {
      await Message.findByIdAndUpdate(replyToId, { hasReplies: true });
    }

    return apiSuccess(
      {
        count: messages.length,
        messages: messages.length === 1 ? messages[0] : messages,
      },
      201
    );
  } catch (error) {
    return apiError(error);
  }
}

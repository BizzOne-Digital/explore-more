import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Message, User } from "@/models";

export default async function StudentMessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/student/messages");

  await connectDB();

  const messages = await Message.find({ recipientId: session.user.id })
    .populate("senderId", "name role")
    .sort({ createdAt: -1 });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-explore-charcoal">Messages</h2>
        <p className="mt-1 text-explore-charcoal/70">Announcements and messages from the academy.</p>
      </div>

      {messages.length === 0 ? (
        <div className="rounded-2xl bg-explore-white p-8 text-center shadow-sm">
          <p className="text-explore-charcoal/60">No messages yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => {
            const sender = msg.senderId as unknown as InstanceType<typeof User> | null;

            return (
              <article
                key={msg._id.toString()}
                className={`rounded-2xl p-5 shadow-sm ${
                  msg.read ? "bg-explore-white" : "border-l-4 border-explore-orange bg-explore-white"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {msg.isAnnouncement && (
                      <span className="mb-1 inline-block rounded-full bg-explore-lime/30 px-2 py-0.5 text-xs font-semibold text-explore-forest">
                        Announcement
                      </span>
                    )}
                    <h3 className="font-semibold text-explore-charcoal">{msg.subject}</h3>
                    <p className="mt-1 text-xs text-explore-charcoal/50">
                      {sender?.name ?? "Explore More Academy"} ·{" "}
                      {new Date(msg.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  {!msg.read && (
                    <span className="shrink-0 rounded-full bg-explore-orange px-2 py-0.5 text-xs font-semibold text-white">
                      New
                    </span>
                  )}
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-explore-charcoal/70">{msg.body}</p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

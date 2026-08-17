"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  User,
  Clock,
  Reply,
  Trash2,
  MailOpen,
  Users,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Message {
  _id: string;
  subject: string;
  body: string;
  read: boolean;
  readAt?: string;
  recipientType: "individual" | "group";
  recipientGroup?: string;
  hasReplies: boolean;
  replyToId?: string;
  senderId?: {
    _id: string;
    name: string;
    email: string;
    role: string;
    studentId?: string;
  };
  recipientId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function MessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [message, setMessage] = useState<Message | null>(null);
  const [replies, setReplies] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    fetchMessage();
    fetchReplies();
  }, [resolvedParams.id]);

  async function fetchMessage() {
    try {
      const res = await fetch(`/api/admin/messages/${resolvedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessage(data.data);
        
        // Mark as read if it's unread and we're the recipient
        if (data.data && !data.data.read && data.data.senderId) {
          markAsRead();
        }
      }
    } catch (error) {
      console.error("Failed to fetch message:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchReplies() {
    try {
      const res = await fetch(`/api/admin/messages/${resolvedParams.id}/replies`);
      if (res.ok) {
        const data = await res.json();
        setReplies(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch replies:", error);
    }
  }

  async function markAsRead() {
    try {
      await fetch(`/api/admin/messages/${resolvedParams.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || !message) return;

    setSendingReply(true);

    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientType: "individual",
          recipientId: message.senderId?._id,
          subject: `Re: ${message.subject}`,
          message: replyText,
          replyToId: message._id,
        }),
      });

      if (res.ok) {
        setReplyText("");
        setShowReplyForm(false);
        fetchReplies();
        fetchMessage(); // Refresh to update hasReplies
      }
    } catch (error) {
      console.error("Failed to send reply:", error);
    } finally {
      setSendingReply(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const res = await fetch(`/api/admin/messages/${resolvedParams.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/admin/messages");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  }

  function formatDate(dateString: string) {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  }

  function getRecipientDisplay() {
    if (!message) return "";
    
    if (message.recipientType === "group") {
      const groupLabels: Record<string, string> = {
        all_parents: "All Parents",
        all_staff: "All Staff",
        all_tutors: "All Tutors",
      };
      return groupLabels[message.recipientGroup || ""] || "Group";
    }
    return message.recipientId.name;
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-white/60">Loading message...</div>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <Mail className="h-12 w-12 text-white/40" />
        <p className="mt-4 text-white/60">Message not found</p>
        <Link
          href="/admin/messages"
          className="mt-4 text-sm text-explore-teal hover:text-explore-teal/80"
        >
          Back to messages
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/messages"
            className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{message.subject}</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-white/60">
              <Clock className="h-4 w-4" />
              {formatDate(message.createdAt)}
              {message.read && message.readAt && (
                <>
                  <span>•</span>
                  <MailOpen className="h-4 w-4" />
                  Read {formatDate(message.readAt)}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {message.senderId && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-2 rounded-lg bg-explore-teal px-4 py-2 text-sm font-medium text-white transition hover:bg-explore-teal/90"
            >
              <Reply className="h-4 w-4" />
              Reply
            </button>
          )}
          <button
            onClick={handleDelete}
            className="rounded-lg bg-red-500/10 p-2 text-red-400 transition hover:bg-red-500/20"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Message Details */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="space-y-2">
            {message.senderId ? (
              <div className="flex items-center gap-2 text-sm text-white/80">
                <User className="h-4 w-4" />
                <span className="font-medium">From:</span>
                <span>{message.senderId.name}</span>
                {message.senderId.studentId && (
                  <span className="font-mono text-xs text-explore-teal">
                    {message.senderId.studentId}
                  </span>
                )}
                <span className="text-white/60">({message.senderId.email})</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-white/80">
                <User className="h-4 w-4" />
                <span className="font-medium">To:</span>
                {message.recipientType === "group" ? (
                  <>
                    <Users className="h-4 w-4 text-purple-400" />
                    <span>{getRecipientDisplay()}</span>
                  </>
                ) : (
                  <>
                    <span>{message.recipientId.name}</span>
                    <span className="text-white/60">({message.recipientId.email})</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!message.read && message.senderId && (
              <span className="rounded-full bg-explore-teal/20 px-3 py-1 text-xs font-medium text-explore-teal">
                Unread
              </span>
            )}
            {message.recipientType === "group" && (
              <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-400">
                Group Message
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 pt-4">
          <p className="whitespace-pre-wrap text-white/90">{message.body}</p>
        </div>
      </div>

      {/* Reply Form */}
      {showReplyForm && message.senderId && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Reply</h3>
          <form onSubmit={handleReply} className="space-y-4">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your reply..."
              rows={6}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30 focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
              required
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowReplyForm(false)}
                className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sendingReply}
                className="flex items-center gap-2 rounded-lg bg-explore-teal px-4 py-2 text-sm font-medium text-white transition hover:bg-explore-teal/90 disabled:opacity-50"
              >
                <Reply className="h-4 w-4" />
                {sendingReply ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Replies */}
      {replies.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">
            Replies ({replies.length})
          </h3>
          {replies.map((reply) => (
            <div
              key={reply._id}
              className="rounded-lg border border-white/10 bg-white/5 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <User className="h-4 w-4" />
                  <span className="font-medium">
                    {reply.senderId?.name || "Unknown"}
                  </span>
                  {reply.senderId?.studentId && (
                    <span className="font-mono text-xs text-explore-teal">
                      {reply.senderId.studentId}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-white/40">
                  <Clock className="h-3 w-3" />
                  {formatDate(reply.createdAt)}
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm text-white/90">{reply.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

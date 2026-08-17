"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Mail,
  MailOpen,
  Send,
  Inbox,
  Filter,
  Clock,
  User,
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

export default function MessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "sent" | "received" | "unread">("all");

  useEffect(() => {
    async function fetchMessages() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/messages?filter=${filter}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();
  }, [filter]);

  const filteredMessages = useMemo(() => {
    if (!searchTerm) return messages;
    
    const term = searchTerm.toLowerCase();
    return messages.filter(
      (msg) =>
        msg.subject.toLowerCase().includes(term) ||
        msg.body.toLowerCase().includes(term) ||
        msg.senderId?.name.toLowerCase().includes(term) ||
        msg.recipientId.name.toLowerCase().includes(term)
    );
  }, [messages, searchTerm]);

  const stats = useMemo(() => {
    return {
      total: messages.length,
      unread: messages.filter((m) => !m.read && m.senderId).length, // Only count received unread
      sent: messages.filter((m) => m.senderId && m.recipientId).length,
      received: messages.filter((m) => m.senderId).length,
    };
  }, [messages]);

  function formatDate(dateString: string) {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  }

  function getRecipientDisplay(msg: Message) {
    if (msg.recipientType === "group") {
      const groupLabels: Record<string, string> = {
        all_parents: "All Parents",
        all_staff: "All Staff",
        all_tutors: "All Tutors",
      };
      return groupLabels[msg.recipientGroup || ""] || "Group";
    }
    return msg.recipientId.name;
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-white/60">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Messages</h1>
          <p className="mt-1 text-white/60">
            Send and manage messages to parents, staff, and tutors
          </p>
        </div>
        <Link
          href="/admin/messages/new"
          className="flex items-center gap-2 rounded-lg bg-explore-teal px-4 py-2 text-sm font-medium text-white transition hover:bg-explore-teal/90"
        >
          <Plus className="h-4 w-4" />
          New Message
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <Mail className="h-8 w-8 text-white/40" />
            <div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-white/60">Total Messages</div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <MailOpen className="h-8 w-8 text-blue-400" />
            <div>
              <div className="text-2xl font-bold text-white">{stats.unread}</div>
              <div className="text-sm text-white/60">Unread</div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <Send className="h-8 w-8 text-green-400" />
            <div>
              <div className="text-2xl font-bold text-white">{stats.sent}</div>
              <div className="text-sm text-white/60">Sent</div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <Inbox className="h-8 w-8 text-purple-400" />
            <div>
              <div className="text-2xl font-bold text-white">{stats.received}</div>
              <div className="text-sm text-white/60">Received</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search messages by subject, content, or sender..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-white/40" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
          >
            <option value="all">All Messages</option>
            <option value="received">Received</option>
            <option value="sent">Sent</option>
            <option value="unread">Unread</option>
          </select>
        </div>
      </div>

      {/* Messages List */}
      <div className="rounded-lg border border-white/10 bg-white/5">
        {filteredMessages.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center">
            <Mail className="h-12 w-12 text-white/40" />
            <p className="mt-4 text-white/60">
              {searchTerm ? "No messages found" : "No messages yet"}
            </p>
            <Link
              href="/admin/messages/new"
              className="mt-4 text-sm text-explore-teal hover:text-explore-teal/80"
            >
              Send your first message
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredMessages.map((message) => (
              <Link
                key={message._id}
                href={`/admin/messages/${message._id}`}
                className="block transition hover:bg-white/5"
              >
                <div className="flex items-start gap-4 p-4">
                  {/* Status Icon */}
                  <div className="mt-1">
                    {message.read ? (
                      <MailOpen className="h-5 w-5 text-white/40" />
                    ) : (
                      <Mail className="h-5 w-5 text-explore-teal" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`truncate text-sm ${
                              message.read ? "font-normal text-white/80" : "font-semibold text-white"
                            }`}
                          >
                            {message.subject}
                          </h3>
                          {message.hasReplies && (
                            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
                              Has replies
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-2 text-xs text-white/60">
                          {message.senderId ? (
                            <>
                              <User className="h-3 w-3" />
                              <span>
                                From: {message.senderId.name}
                                {message.senderId.studentId && (
                                  <span className="ml-1 font-mono text-explore-teal">
                                    ({message.senderId.studentId})
                                  </span>
                                )}
                              </span>
                            </>
                          ) : (
                            <>
                              <Send className="h-3 w-3" />
                              <span>To: {getRecipientDisplay(message)}</span>
                            </>
                          )}
                          {message.recipientType === "group" && (
                            <Users className="h-3 w-3 text-purple-400" />
                          )}
                        </div>

                        <p className="mt-2 line-clamp-2 text-sm text-white/60">
                          {message.body}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1 text-xs text-white/40">
                          <Clock className="h-3 w-3" />
                          {formatDate(message.createdAt)}
                        </div>
                        {!message.read && message.senderId && (
                          <span className="rounded-full bg-explore-teal/20 px-2 py-0.5 text-xs font-medium text-explore-teal">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

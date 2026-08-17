"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Users, User, Send, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface UserOption {
  _id: string;
  name: string;
  email: string;
  role: string;
  studentId?: string;
}

export default function NewMessagePage() {
  const router = useRouter();
  const [recipientType, setRecipientType] = useState<"individual" | "group">("individual");
  const [recipientGroup, setRecipientGroup] = useState<string>("");
  const [recipientId, setRecipientId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (recipientType !== "individual") return;

    async function fetchUsers() {
      try {
        const res = await fetch("/api/admin/users");
        if (res.ok) {
          const data = await res.json();
          setUsers(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    }

    fetchUsers();
  }, [recipientType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (recipientType === "individual" && !recipientId) {
      setError("Please select a recipient");
      return;
    }

    if (recipientType === "group" && !recipientGroup) {
      setError("Please select a recipient group");
      return;
    }

    if (!subject.trim() || !message.trim()) {
      setError("Subject and message are required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientType,
          recipientId: recipientType === "individual" ? recipientId : undefined,
          recipientGroup: recipientType === "group" ? recipientGroup : undefined,
          subject,
          message,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to send message");
        setLoading(false);
        return;
      }

      router.push("/admin/messages");
      router.refresh();
    } catch (err) {
      setError("Failed to send message");
      setLoading(false);
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.studentId && user.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const roleLabels: Record<string, string> = {
    parent: "Parent",
    administrator: "Staff",
    instructor: "Tutor",
    student: "Student",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/messages"
          className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">New Message</h1>
          <p className="mt-1 text-white/60">Compose and send a message</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipient Type */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <label className="mb-4 block text-sm font-medium text-white/80">
            Send To
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="relative flex cursor-pointer rounded-lg border-2 border-white/10 bg-white/5 p-4 transition hover:border-white/20">
              <input
                type="radio"
                name="recipientType"
                value="individual"
                checked={recipientType === "individual"}
                onChange={(e) => setRecipientType(e.target.value as "individual")}
                className="sr-only"
              />
              <div
                className={`flex-1 ${
                  recipientType === "individual" ? "text-explore-teal" : "text-white/60"
                }`}
              >
                <User
                  className={`mx-auto h-8 w-8 ${
                    recipientType === "individual" ? "text-explore-teal" : "text-white/40"
                  }`}
                />
                <p className="mt-2 text-center font-medium">Individual</p>
                <p className="mt-1 text-center text-xs text-white/40">
                  Send to one person
                </p>
              </div>
              {recipientType === "individual" && (
                <div className="absolute right-2 top-2 h-3 w-3 rounded-full bg-explore-teal" />
              )}
            </label>

            <label className="relative flex cursor-pointer rounded-lg border-2 border-white/10 bg-white/5 p-4 transition hover:border-white/20">
              <input
                type="radio"
                name="recipientType"
                value="group"
                checked={recipientType === "group"}
                onChange={(e) => setRecipientType(e.target.value as "group")}
                className="sr-only"
              />
              <div
                className={`flex-1 ${
                  recipientType === "group" ? "text-explore-teal" : "text-white/60"
                }`}
              >
                <Users
                  className={`mx-auto h-8 w-8 ${
                    recipientType === "group" ? "text-explore-teal" : "text-white/40"
                  }`}
                />
                <p className="mt-2 text-center font-medium">Group</p>
                <p className="mt-1 text-center text-xs text-white/40">
                  Send to multiple people
                </p>
              </div>
              {recipientType === "group" && (
                <div className="absolute right-2 top-2 h-3 w-3 rounded-full bg-explore-teal" />
              )}
            </label>
          </div>
        </div>

        {/* Recipient Selection */}
        {recipientType === "individual" ? (
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <label className="mb-2 block text-sm font-medium text-white/80">
              Select Recipient
            </label>
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
            />
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {filteredUsers.map((user) => (
                <label
                  key={user._id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
                >
                  <input
                    type="radio"
                    name="recipient"
                    value={user._id}
                    checked={recipientId === user._id}
                    onChange={(e) => setRecipientId(e.target.value)}
                    className="h-4 w-4 border-white/20 bg-white/10 text-explore-teal focus:ring-explore-teal"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                        {roleLabels[user.role] || user.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <span>{user.email}</span>
                      {user.studentId && (
                        <span className="font-mono text-explore-teal">
                          {user.studentId}
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
              {filteredUsers.length === 0 && (
                <p className="py-8 text-center text-sm text-white/40">
                  No users found
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <label className="mb-2 block text-sm font-medium text-white/80">
              Select Group
            </label>
            <select
              value={recipientGroup}
              onChange={(e) => setRecipientGroup(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
            >
              <option value="">Choose a group...</option>
              <option value="all_parents">All Parents</option>
              <option value="all_staff">All Staff</option>
              <option value="all_tutors">All Tutors</option>
            </select>
          </div>
        )}

        {/* Subject */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <label className="mb-2 block text-sm font-medium text-white/80">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter subject line..."
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30 focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
            required
          />
        </div>

        {/* Message */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <label className="mb-2 block text-sm font-medium text-white/80">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message here..."
            rows={10}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30 focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
            required
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/messages"
            className="rounded-lg border border-white/20 bg-white/10 px-6 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-explore-teal px-6 py-2 text-sm font-medium text-white transition hover:bg-explore-teal/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {loading ? "Sending..." : "Send Message"}
          </button>
        </div>
      </form>
    </div>
  );
}

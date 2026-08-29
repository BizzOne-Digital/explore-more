"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Paperclip, X } from "lucide-react";

interface StaffMember {
  _id: string;
  name: string;
  title: string;
  categories: Array<{ id: string; label: string }>;
}

interface Conversation {
  _id: string;
  subject: string;
  staffId: { name: string };
  parentUnread: number;
  lastMessageAt: string;
}

interface MessageAttachment {
  path: string;
  originalName: string;
  mimeType: string;
}

interface ThreadMessage {
  _id: string;
  body: string;
  senderId: { name: string };
  createdAt: string;
  attachments?: MessageAttachment[];
}

function StaffRecipientPicker({
  staff,
  value,
  onChange,
}: {
  staff: StaffMember[];
  value: string;
  onChange: (staffId: string) => void;
}) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const options = useMemo(
    () =>
      staff.map((member) => ({
        value: member._id,
        label: member.name,
        sublabel: `${member.title} · ${member.categories.map((c) => c.label).join(", ")}`,
        searchText: [
          member.name,
          member.title,
          ...member.categories.map((c) => c.label),
        ]
          .join(" ")
          .toLowerCase(),
      })),
    [staff]
  );

  const selected = options.find((option) => option.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.searchText.includes(q));
  }, [options, query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        if (selected) setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selected]);

  function handleSelect(staffId: string) {
    onChange(staffId);
    setQuery("");
    setOpen(false);
  }

  const displayValue = open ? query : selected?.label ?? "";

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-sm font-medium text-explore-charcoal">
        Who would you like to reach?
      </label>
      <div className="relative">
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          value={displayValue}
          placeholder="Type a name, role, or department…"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value) onChange("");
          }}
          onFocus={() => setOpen(true)}
          className="w-full rounded-lg border border-explore-charcoal/20 px-3 py-2 pr-10 text-sm focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
          autoComplete="off"
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-explore-charcoal/40" />
      </div>
      <p className="mt-1 text-xs text-explore-charcoal/50">
        Start typing to search staff by name or role.
      </p>
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-explore-charcoal/10 bg-white shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-explore-charcoal/50">No matches found</li>
          ) : (
            filtered.map((option) => (
              <li key={option.value} role="option" aria-selected={option.value === value}>
                <button
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-3 py-2.5 text-left text-sm transition hover:bg-explore-sand ${
                    option.value === value ? "bg-explore-teal/10" : ""
                  }`}
                >
                  <span className="block font-medium text-explore-charcoal">{option.label}</span>
                  {option.sublabel && (
                    <span className="mt-0.5 block text-xs text-explore-charcoal/50">
                      {option.sublabel}
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export function ParentMessagesClient({
  conversations: initial,
  staff,
}: {
  conversations: Conversation[];
  staff: StaffMember[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [conversations] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [body, setBody] = useState("");
  const [staffId, setStaffId] = useState(staff[0]?._id ?? "");
  const [subject, setSubject] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadThread(id: string) {
    setSelectedId(id);
    const res = await fetch(`/api/parent/messages/thread?conversationId=${id}`);
    const json = await res.json();
    if (json.success) setMessages(json.data.messages);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length === 0) return;
    setAttachedFiles((prev) => [...prev, ...picked]);
    e.target.value = "";
  }

  function removeFile(index: number) {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!selectedId && !staffId) {
      setError("Please select who you would like to message.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.set("body", body);
    if (selectedId) formData.set("conversationId", selectedId);
    else {
      formData.set("staffId", staffId);
      formData.set("subject", subject);
    }

    for (const file of attachedFiles) {
      formData.append("files", file);
    }

    try {
      const res = await fetch("/api/parent/messages", { method: "POST", body: formData });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Failed to send message");
        return;
      }

      setBody("");
      setAttachedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
      if (selectedId) await loadThread(selectedId);
      else if (json.data?.conversation?._id) {
        await loadThread(json.data.conversation._id);
      }
    } catch {
      setError("Failed to send message");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-1">
        <h3 className="font-semibold text-explore-charcoal">Conversations</h3>
        {conversations.length === 0 && (
          <p className="text-sm text-explore-charcoal/60">No conversations yet. Start one below.</p>
        )}
        {conversations.map((c) => (
          <button
            key={c._id}
            type="button"
            onClick={() => loadThread(c._id)}
            className="w-full rounded-xl border border-explore-charcoal/10 bg-white p-4 text-left hover:bg-explore-sand"
          >
            <p className="font-medium text-sm">{c.subject}</p>
            <p className="text-xs text-explore-charcoal/50">{c.staffId?.name}</p>
            {c.parentUnread > 0 && (
              <span className="mt-1 inline-block rounded-full bg-explore-orange px-2 py-0.5 text-xs text-white">
                {c.parentUnread} new
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="lg:col-span-2 space-y-4">
        {selectedId && (
          <div className="max-h-80 space-y-3 overflow-y-auto rounded-xl bg-white p-4 shadow-sm">
            {messages.map((m) => (
              <div key={m._id} className="rounded-lg bg-explore-cream p-3 text-sm">
                <p className="text-xs font-semibold text-explore-teal">{m.senderId?.name}</p>
                <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                {m.attachments && m.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {m.attachments.map((file) => (
                      <a
                        key={file.path}
                        href={`/api/files/private/${file.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs font-semibold text-explore-teal hover:underline"
                      >
                        📎 {file.originalName}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={sendMessage} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          {!selectedId && (
            <>
              <StaffRecipientPicker staff={staff} value={staffId} onChange={setStaffId} />
              <div>
                <label className="mb-1 block text-sm font-medium text-explore-charcoal">
                  Subject
                </label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What is this about?"
                  required
                  className="w-full rounded-lg border border-explore-charcoal/20 px-3 py-2 text-sm focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
                />
              </div>
            </>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-explore-charcoal">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Write your message…"
              required
              className="w-full rounded-lg border border-explore-charcoal/20 px-3 py-2 text-sm focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
            />
          </div>

          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-explore-charcoal/20 bg-explore-sand px-3 py-2 text-sm font-medium text-explore-charcoal hover:bg-explore-sand/80"
            >
              <Paperclip className="h-4 w-4" />
              Attach files
              <span className="text-xs font-normal text-explore-charcoal/50">(optional)</span>
            </button>
            {attachedFiles.length > 0 && (
              <ul className="space-y-1">
                {attachedFiles.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between gap-2 rounded-lg bg-explore-cream px-3 py-1.5 text-sm"
                  >
                    <span className="truncate text-explore-charcoal/80">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="shrink-0 rounded p-0.5 text-explore-charcoal/40 hover:text-red-600"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-explore-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send Message"}
          </button>
        </form>
      </div>
    </div>
  );
}

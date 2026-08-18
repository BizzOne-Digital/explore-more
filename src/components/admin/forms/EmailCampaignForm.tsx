"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import {
  FormField,
  TextInput,
  SelectInput,
  FormActions,
  FormSection,
  CheckboxInput,
} from "@/components/admin/forms";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { FileUpload } from "@/components/admin/FileUpload";
import { PageHeader } from "@/components/admin/PageHeader";
import { Mail, Bell, Users, Send, Eye, AlertCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  audienceAllowsEmptyRecipients,
  canEditCampaign,
  canSendCampaign,
} from "@/lib/email/campaign-utils";

const schema = z.object({
  type: z.enum(["event", "course", "announcement", "custom"]),
  subject: z.string().min(1, "Subject is required"),
  htmlBody: z.string().min(1, "Message content is required"),
  deliveryMethod: z.enum(["email", "notification", "both"]),
  audience: z.enum(["all_parents", "portfolio_parents", "tutoring_parents", "custom"]),
  priority: z.enum(["normal", "important", "urgent"]),
  attachmentUrl: z.string().optional(),
  attachmentName: z.string().optional(),
  imageUrl: z.string().optional(),
  imageName: z.string().optional(),
  status: z.enum(["draft", "queued", "sent"]),
});

type FormData = z.infer<typeof schema>;

interface User {
  _id: string;
  name: string;
  email: string;
}

export function EmailCampaignForm({
  initialData,
  isNew = false,
}: {
  initialData?: Record<string, unknown> & { _id?: string };
  isNew?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [recipientCount, setRecipientCount] = useState(0);
  const [recipientHint, setRecipientHint] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const campaignStatus = (initialData?.status as string) ?? "draft";
  const isReadOnly = !isNew && !canEditCampaign(campaignStatus);
  const canSend = isNew || canSendCampaign(campaignStatus);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: (initialData?.type as FormData["type"]) ?? "announcement",
      subject: (initialData?.subject as string) ?? "",
      htmlBody: (initialData?.htmlBody as string) ?? "",
      deliveryMethod: (initialData?.deliveryMethod as FormData["deliveryMethod"]) ?? "both",
      audience: (initialData?.audience as FormData["audience"]) ?? "all_parents",
      priority: (initialData?.priority as FormData["priority"]) ?? "normal",
      attachmentUrl: (initialData?.attachmentUrl as string) ?? "",
      attachmentName: (initialData?.attachmentName as string) ?? "",
      imageUrl: (initialData?.imageUrl as string) ?? "",
      imageName: (initialData?.imageName as string) ?? "",
      status: (initialData?.status as FormData["status"]) ?? "draft",
    },
  });

  const watchAudience = watch("audience");
  const watchDeliveryMethod = watch("deliveryMethod");
  const watchPriority = watch("priority");
  const watchHtmlBody = watch("htmlBody");
  const watchSubject = watch("subject");

  // Fetch recipient count when audience changes
  useEffect(() => {
    async function fetchRecipientCount() {
      try {
        const res = await fetch(`/api/admin/email-campaigns/recipients?audience=${watchAudience}`);
        if (res.ok) {
          const data = await res.json();
          setRecipientCount(data.data?.count ?? 0);
          setRecipientHint(data.data?.hint ?? "");
        }
      } catch (err) {
        console.error("Failed to fetch recipient count:", err);
      }
    }

    if (watchAudience !== "custom") {
      fetchRecipientCount();
    }
  }, [watchAudience]);

  // Fetch users for custom audience
  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/admin/users?role=parent");
        if (res.ok) {
          const data = await res.json();
          setUsers(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    }

    if (watchAudience === "custom") {
      fetchUsers();
    }
  }, [watchAudience]);

  async function onSubmit(data: FormData) {
    setError(null);

    // Add recipient IDs for custom audience
    const payload: Record<string, unknown> = { ...data };
    if (data.audience === "custom") {
      payload.recipientIds = selectedUserIds;
      payload.recipientCount = selectedUserIds.length;
    } else {
      payload.recipientCount = recipientCount;
    }

    const url = isNew
      ? "/api/admin/email-campaigns"
      : `/api/admin/email-campaigns/${initialData?._id}`;
    const res = await fetch(url, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) {
      setError(json.error ?? "Save failed");
      return;
    }
    router.push("/admin/email-campaigns");
    router.refresh();
  }

  async function handleSendNow() {
    if (
      watchAudience === "custom" &&
      selectedUserIds.length === 0
    ) {
      setError("Select at least one recipient for a custom campaign.");
      return;
    }

    if (
      watchAudience !== "custom" &&
      recipientCount === 0 &&
      !audienceAllowsEmptyRecipients(watchAudience, watchDeliveryMethod)
    ) {
      setError(recipientHint || "No recipients found for the selected audience.");
      return;
    }

    if (!confirm("Are you sure you want to send this campaign now? This action cannot be undone.")) {
      return;
    }
    setValue("status", "queued");
    handleSubmit(onSubmit)();
  }

  async function handleDelete() {
    if (!initialData?._id) return;
    if (
      !confirm(
        "Delete this campaign permanently? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/email-campaigns/${initialData._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Delete failed");
        return;
      }
      router.push("/admin/email-campaigns");
      router.refresh();
    } catch {
      setError("Delete failed");
    }
  }

  const priorityInfo = {
    normal: { color: "text-blue-400", icon: "📢", label: "Normal" },
    important: { color: "text-yellow-400", icon: "⚠️", label: "Important" },
    urgent: { color: "text-red-400", icon: "🚨", label: "Urgent" },
  };

  return (
    <div>
      <PageHeader
        title={isNew ? "New Email Campaign" : "Edit Email Campaign"}
        description="Create and send email campaigns or in-app notifications to parents"
      />
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {isReadOnly && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {campaignStatus === "sent" ? (
            <>
              This campaign was already sent
              {initialData?.sentAt
                ? ` on ${new Date(String(initialData.sentAt)).toLocaleString()}`
                : ""}
              .{" "}
              <Link href="/admin/email-campaigns/new" className="font-medium underline">
                Create a new campaign
              </Link>{" "}
              to send another message.
            </>
          ) : campaignStatus === "sending" ? (
            "This campaign is currently sending."
          ) : campaignStatus === "queued" ? (
            "This campaign is queued and will send shortly."
          ) : (
            "This campaign can no longer be edited."
          )}
        </div>
      )}

      <fieldset disabled={isReadOnly} className={isReadOnly ? "opacity-80" : undefined}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Campaign Settings */}
        <FormSection title="Campaign Settings">
          <FormField label="Campaign Type" error={errors.type} className="sm:col-span-1">
            <SelectInput
              registration={register("type")}
              error={errors.type}
              options={[
                { value: "event", label: "Event" },
                { value: "course", label: "Course" },
                { value: "announcement", label: "Announcement" },
                { value: "custom", label: "Custom" },
              ]}
            />
          </FormField>

          <FormField label="Priority" error={errors.priority} className="sm:col-span-1">
            <SelectInput
              registration={register("priority")}
              error={errors.priority}
              options={[
                { value: "normal", label: "📢 Normal" },
                { value: "important", label: "⚠️ Important" },
                { value: "urgent", label: "🚨 Urgent" },
              ]}
            />
          </FormField>
        </FormSection>

        {/* Delivery Method */}
        <FormSection
          title="Delivery Method"
          description="Choose how this campaign will be delivered to recipients"
        >
          <div className="sm:col-span-2">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="relative flex cursor-pointer rounded-lg border-2 border-white/10 bg-white/5 p-4 transition hover:border-white/20">
                <input
                  type="radio"
                  value="email"
                  {...register("deliveryMethod")}
                  className="sr-only"
                />
                <div
                  className={`flex-1 ${
                    watchDeliveryMethod === "email" ? "text-explore-teal" : "text-white/60"
                  }`}
                >
                  <Mail
                    className={`mx-auto h-8 w-8 ${
                      watchDeliveryMethod === "email" ? "text-explore-teal" : "text-white/40"
                    }`}
                  />
                  <p className="mt-2 text-center font-medium">Email Only</p>
                  <p className="mt-1 text-center text-xs text-white/40">
                    Send via email to recipients
                  </p>
                </div>
                {watchDeliveryMethod === "email" && (
                  <div className="absolute right-2 top-2 h-3 w-3 rounded-full bg-explore-teal" />
                )}
              </label>

              <label className="relative flex cursor-pointer rounded-lg border-2 border-white/10 bg-white/5 p-4 transition hover:border-white/20">
                <input
                  type="radio"
                  value="notification"
                  {...register("deliveryMethod")}
                  className="sr-only"
                />
                <div
                  className={`flex-1 ${
                    watchDeliveryMethod === "notification" ? "text-explore-teal" : "text-white/60"
                  }`}
                >
                  <Bell
                    className={`mx-auto h-8 w-8 ${
                      watchDeliveryMethod === "notification" ? "text-explore-teal" : "text-white/40"
                    }`}
                  />
                  <p className="mt-2 text-center font-medium">Notification Only</p>
                  <p className="mt-1 text-center text-xs text-white/40">
                    In-app notification only
                  </p>
                </div>
                {watchDeliveryMethod === "notification" && (
                  <div className="absolute right-2 top-2 h-3 w-3 rounded-full bg-explore-teal" />
                )}
              </label>

              <label className="relative flex cursor-pointer rounded-lg border-2 border-white/10 bg-white/5 p-4 transition hover:border-white/20">
                <input
                  type="radio"
                  value="both"
                  {...register("deliveryMethod")}
                  className="sr-only"
                />
                <div
                  className={`flex-1 ${
                    watchDeliveryMethod === "both" ? "text-explore-teal" : "text-white/60"
                  }`}
                >
                  <div className="flex justify-center gap-1">
                    <Mail
                      className={`h-6 w-6 ${
                        watchDeliveryMethod === "both" ? "text-explore-teal" : "text-white/40"
                      }`}
                    />
                    <Bell
                      className={`h-6 w-6 ${
                        watchDeliveryMethod === "both" ? "text-explore-teal" : "text-white/40"
                      }`}
                    />
                  </div>
                  <p className="mt-2 text-center font-medium">Both</p>
                  <p className="mt-1 text-center text-xs text-white/40">
                    Email + notification
                  </p>
                </div>
                {watchDeliveryMethod === "both" && (
                  <div className="absolute right-2 top-2 h-3 w-3 rounded-full bg-explore-teal" />
                )}
              </label>
            </div>
          </div>
        </FormSection>

        {/* Audience Selection */}
        <FormSection
          title="Audience"
          description="Select who will receive this campaign"
        >
          <FormField label="Recipient Group" error={errors.audience} className="sm:col-span-2">
            <SelectInput
              registration={register("audience")}
              error={errors.audience}
              options={[
                { value: "all_parents", label: "All Parents" },
                { value: "portfolio_parents", label: "Homeschool Portfolio Parents" },
                { value: "tutoring_parents", label: "Tutoring Parents" },
                { value: "custom", label: "Custom Selection" },
              ]}
            />
          </FormField>

          {watchAudience === "custom" ? (
            <div className="sm:col-span-2">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-white/80">Select Recipients</p>
                  <p className="text-xs text-white/60">{selectedUserIds.length} selected</p>
                </div>
                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {users.map((user) => (
                    <label
                      key={user._id}
                      className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUserIds([...selectedUserIds, user._id]);
                          } else {
                            setSelectedUserIds(selectedUserIds.filter((id) => id !== user._id));
                          }
                        }}
                        className="h-4 w-4 rounded border-white/20 bg-white/10 text-explore-teal focus:ring-explore-teal"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs text-white/60">{user.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-4">
                <Users className="h-5 w-5 text-white/40" />
                <div>
                  <p className="text-sm font-medium text-white">
                    {recipientCount} recipient{recipientCount !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-white/60">
                    {recipientCount > 0
                      ? "will receive this campaign"
                      : audienceAllowsEmptyRecipients(watchAudience, watchDeliveryMethod)
                        ? "No parent accounts yet — in-app notifications will still be published for future parents."
                        : recipientHint || "No recipients found for this audience."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </FormSection>

        {/* Campaign Image */}
        <FormSection
          title="Campaign Image (Optional)"
          description="Upload a header or banner image for this campaign"
        >
          <div className="sm:col-span-2">
            <Controller
              name="imageUrl"
              control={control}
              render={({ field }) => (
                <FileUpload
                  label="Campaign Picture"
                  value={field.value || ""}
                  fileName={watch("imageName")}
                  mode="image"
                  maxSize={null}
                  onChange={(url, name) => {
                    field.onChange(url);
                    setValue("imageName", name);
                  }}
                  onRemove={() => {
                    field.onChange("");
                    setValue("imageName", "");
                  }}
                />
              )}
            />
          </div>
        </FormSection>

        {/* Message Content */}
        <FormSection title="Message Content">
          <FormField
            label="Subject Line"
            error={errors.subject}
            required
            className="sm:col-span-2"
          >
            <TextInput registration={register("subject")} error={errors.subject} />
          </FormField>

          <div className="sm:col-span-2">
            <Controller
              name="htmlBody"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  label="Message"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.htmlBody}
                  enableImageUpload
                  placeholder="Write your message here. Use the toolbar to add formatting, links, images, and buttons."
                />
              )}
            />
          </div>
        </FormSection>

        {/* Attachment */}
        <FormSection
          title="File Attachment (Optional)"
          description="Drag and drop a file to attach to this campaign"
        >
          <div className="sm:col-span-2">
            <Controller
              name="attachmentUrl"
              control={control}
              render={({ field }) => (
                <FileUpload
                  label="Attach File"
                  value={field.value || ""}
                  fileName={watch("attachmentName")}
                  mode="any"
                  maxSize={null}
                  onChange={(url, fileName) => {
                    field.onChange(url);
                    setValue("attachmentName", fileName);
                  }}
                  onRemove={() => {
                    field.onChange("");
                    setValue("attachmentName", "");
                  }}
                />
              )}
            />
          </div>
        </FormSection>

        {/* Preview */}
        {showPreview && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Campaign Preview</h3>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="text-sm text-white/60 hover:text-white"
              >
                Hide Preview
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg bg-white p-6">
                <div
                  className={`mb-4 flex items-center gap-2 border-l-4 ${
                    watchPriority === "urgent"
                      ? "border-red-500"
                      : watchPriority === "important"
                      ? "border-yellow-500"
                      : "border-blue-500"
                  } bg-gray-50 p-3`}
                >
                  <span className="text-2xl">{priorityInfo[watchPriority].icon}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{watchSubject}</p>
                    <p className="text-xs text-gray-600">
                      {priorityInfo[watchPriority].label} Priority
                    </p>
                  </div>
                </div>

                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: watchHtmlBody }}
                />

                {watch("imageUrl") && (
                  <div className="mt-4 overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={watch("imageUrl")}
                      alt={watch("imageName") || "Campaign image"}
                      className="max-h-64 w-full object-cover"
                    />
                  </div>
                )}

                {watch("attachmentUrl") && (
                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-sm text-gray-600">
                      📎 Attachment: {watch("attachmentName")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/5 p-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 text-white/40" />
            <p className="text-xs text-white/60">
              {watchDeliveryMethod === "email"
                ? "Emails will be sent to all recipients in the selected audience."
                : watchDeliveryMethod === "notification"
                ? "Notifications will appear in the parent portal for all recipients."
                : "Both email and in-app notifications will be sent to all recipients."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {!isNew && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4" />
                Delete Campaign
              </button>
            )}

            {!showPreview && (
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isReadOnly}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
            >
              Save as Draft
            </button>

            {canSend && (
              <button
                type="button"
                onClick={handleSendNow}
                disabled={
                  isSubmitting ||
                  (watchAudience === "custom" && selectedUserIds.length === 0) ||
                  (watchAudience !== "custom" &&
                    recipientCount === 0 &&
                    !audienceAllowsEmptyRecipients(watchAudience, watchDeliveryMethod))
                }
                className="flex items-center gap-2 rounded-lg bg-explore-teal px-4 py-2 text-sm font-medium text-white transition hover:bg-explore-teal/90 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {campaignStatus === "failed" ? "Retry Send" : "Send Now"}
              </button>
            )}
          </div>
        </div>
      </form>
      </fieldset>
    </div>
  );
}

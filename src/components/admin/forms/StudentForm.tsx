"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import Link from "next/link";
import {
  FormField,
  TextInput,
  TextArea,
  SelectInput,
  CheckboxInput,
  FormSection,
} from "@/components/admin/forms";
import { PageHeader } from "@/components/admin/PageHeader";
import { Send, Trash2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  schoolStatus: z.enum(["homeschool", "traditional", "other", ""]).optional(),
  bio: z.string().optional(),
  isActive: z.boolean(),
  emailVerified: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface GuardianLink {
  _id: string;
  guardianId: { name: string; email: string };
  relationship: string;
  status: string;
}

export function StudentForm({
  initialData,
  isNew = false,
  guardianLinks = [],
}: {
  initialData?: Record<string, unknown> & { _id?: string };
  isNew?: boolean;
  guardianLinks?: GuardianLink[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [sendingReset, setSendingReset] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: (initialData?.name as string) ?? "",
      email: (initialData?.email as string) ?? "",
      phone: (initialData?.phone as string) ?? "",
      dateOfBirth: initialData?.dateOfBirth
        ? new Date(initialData.dateOfBirth as string).toISOString().slice(0, 10)
        : "",
      schoolStatus: (initialData?.schoolStatus as FormData["schoolStatus"]) ?? "",
      bio: (initialData?.bio as string) ?? "",
      isActive: (initialData?.isActive as boolean) ?? true,
      emailVerified: (initialData?.emailVerified as boolean) ?? false,
    },
  });

  async function onSubmit(data: FormData) {
    setError(null);
    
    const payload = {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      role: "student",
    };

    const url = isNew ? "/api/admin/students" : `/api/admin/students/${initialData?._id}`;
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
    router.push("/admin/students");
    router.refresh();
  }

  async function handleDeactivate() {
    if (!initialData?._id) return;
    if (!confirm("Are you sure you want to deactivate this student account?")) return;

    try {
      const res = await fetch(`/api/admin/students/${initialData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Deactivate failed");
        return;
      }
      router.refresh();
    } catch (err) {
      setError("Deactivate failed");
    }
  }

  async function handleDelete() {
    if (!initialData?._id) return;
    if (!confirm("Are you sure you want to permanently delete this student account? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/admin/students/${initialData._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Delete failed");
        return;
      }
      router.push("/admin/students");
      router.refresh();
    } catch (err) {
      setError("Delete failed");
    }
  }

  async function handlePasswordReset() {
    if (!initialData?._id) return;
    
    // Find parent/guardian email from links
    const parentLink = guardianLinks.find(link => link.status === "approved");
    if (!parentLink) {
      setError("No parent/guardian account is linked to this student.");
      return;
    }

    if (!confirm(`Send password reset link to parent/guardian (${parentLink.guardianId.email})?`)) return;

    setSendingReset(true);
    try {
      const res = await fetch(`/api/admin/students/${initialData._id}/password-reset`, {
        method: "POST",
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Failed to send reset link");
        setSendingReset(false);
        return;
      }
      alert("Password reset link sent successfully!");
      setSendingReset(false);
    } catch (err) {
      setError("Failed to send reset link");
      setSendingReset(false);
    }
  }

  return (
    <div>
      <PageHeader title={isNew ? "New Student" : "Edit Student"} />
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {!isNew && typeof initialData?.studentId === "string" && initialData.studentId ? (
        <div className="mb-6 rounded-xl border border-explore-teal/30 bg-explore-teal/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60">Student ID</p>
              <p className="font-mono text-lg font-semibold text-explore-teal">
                {initialData.studentId}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Student Information">
          <FormField label="Full Name" error={errors.name} required className="sm:col-span-2">
            <TextInput registration={register("name")} error={errors.name} />
          </FormField>
          <FormField label="Email" error={errors.email} required>
            <TextInput registration={register("email")} error={errors.email} type="email" />
          </FormField>
          <FormField label="Phone" error={errors.phone}>
            <TextInput registration={register("phone")} error={errors.phone} type="tel" />
          </FormField>
          <FormField label="Date of Birth" error={errors.dateOfBirth}>
            <TextInput registration={register("dateOfBirth")} error={errors.dateOfBirth} type="date" />
          </FormField>
          <FormField label="School Status" error={errors.schoolStatus}>
            <SelectInput
              registration={register("schoolStatus")}
              error={errors.schoolStatus}
              options={[
                { value: "", label: "—" },
                { value: "homeschool", label: "Homeschool" },
                { value: "traditional", label: "Traditional School" },
                { value: "other", label: "Other" },
              ]}
            />
          </FormField>
          <FormField label="Bio" error={errors.bio} className="sm:col-span-2">
            <TextArea registration={register("bio")} error={errors.bio} rows={4} />
          </FormField>
        </FormSection>

        {!isNew && guardianLinks.length > 0 && (
          <FormSection title="Parent/Guardian Links">
            <div className="sm:col-span-2 space-y-2">
              {guardianLinks.map((link) => (
                <div
                  key={link._id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
                >
                  <div>
                    <p className="font-medium text-white">{link.guardianId.name}</p>
                    <p className="text-xs text-white/60">{link.guardianId.email}</p>
                    <p className="text-xs text-white/40">{link.relationship}</p>
                  </div>
                  <div className="text-sm">
                    <span
                      className={
                        link.status === "approved"
                          ? "text-green-400"
                          : link.status === "pending"
                          ? "text-yellow-400"
                          : "text-red-400"
                      }
                    >
                      {link.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </FormSection>
        )}

        <FormSection title="Account Status">
          <div className="flex flex-col gap-3 sm:col-span-2">
            <CheckboxInput registration={register("isActive")} label="Account Active" />
            <CheckboxInput registration={register("emailVerified")} label="Email Verified" />
          </div>
        </FormSection>

        <div className="flex items-center gap-3 border-t border-white/10 pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-explore-lime px-5 py-2 text-sm font-semibold text-explore-black transition hover:bg-explore-lime/90 disabled:opacity-50"
          >
            {isSubmitting ? "Saving…" : "Save"}
          </button>

          {!isNew && guardianLinks.length > 0 && (
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={sendingReset}
              className="flex items-center gap-2 rounded-lg border border-explore-teal px-5 py-2 text-sm font-medium text-explore-teal transition hover:bg-explore-teal/10 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {sendingReset ? "Sending…" : "Send Password Reset"}
            </button>
          )}

          {!isNew && (
            <>
              <button
                type="button"
                onClick={handleDeactivate}
                className="rounded-lg border border-orange-500/30 px-5 py-2 text-sm font-medium text-orange-400 transition hover:bg-orange-500/10"
              >
                Deactivate
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-2 rounded-lg border border-red-500/30 px-5 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          )}

          <Link
            href="/admin/students"
            className="rounded-lg border border-white/10 px-5 py-2 text-sm font-medium text-white/60 transition hover:text-white"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

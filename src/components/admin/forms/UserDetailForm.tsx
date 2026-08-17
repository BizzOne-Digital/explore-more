"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import {
  FormField,
  TextInput,
  SelectInput,
  CheckboxInput,
  FormSection,
} from "@/components/admin/forms";
import { PageHeader } from "@/components/admin/PageHeader";
import Link from "next/link";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  role: z.enum(["student", "parent", "instructor", "administrator"]),
  isActive: z.boolean(),
  emailVerified: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Child {
  _id: string;
  name: string;
  studentId?: string;
  email: string;
}

interface Guardian {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

export function UserDetailForm({
  initialData,
  children = [],
  guardians = [],
}: {
  initialData?: Record<string, unknown> & { _id?: string };
  children?: Child[];
  guardians?: Guardian[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
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
      role: (initialData?.role as FormData["role"]) ?? "student",
      isActive: (initialData?.isActive as boolean) ?? true,
      emailVerified: (initialData?.emailVerified as boolean) ?? false,
    },
  });

  async function onSubmit(data: FormData) {
    setError(null);

    const url = `/api/admin/users/${initialData?._id}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) {
      setError(json.error ?? "Save failed");
      return;
    }
    router.refresh();
  }

  async function handleDeactivate() {
    if (!initialData?._id) return;
    if (!confirm("Are you sure you want to deactivate this user account?")) return;

    try {
      const res = await fetch(`/api/admin/users/${initialData._id}`, {
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
    if (!confirm("Are you sure you want to permanently delete this user account? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/admin/users/${initialData._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Delete failed");
        return;
      }
      router.push("/admin/users");
      router.refresh();
    } catch (err) {
      setError("Delete failed");
    }
  }

  return (
    <div>
      <PageHeader title={`User: ${initialData?.name || "Unknown"}`} />
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {typeof initialData?.studentId === "string" && initialData.studentId ? (
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
        <FormSection title="User Information">
          <FormField label="Full Name" error={errors.name} required className="sm:col-span-2">
            <TextInput registration={register("name")} error={errors.name} />
          </FormField>
          <FormField label="Email" error={errors.email} required>
            <TextInput registration={register("email")} error={errors.email} type="email" />
          </FormField>
          <FormField label="Phone" error={errors.phone}>
            <TextInput registration={register("phone")} error={errors.phone} type="tel" />
          </FormField>
          <FormField label="Role" error={errors.role} required>
            <SelectInput
              registration={register("role")}
              error={errors.role}
              options={[
                { value: "student", label: "Student" },
                { value: "parent", label: "Parent" },
                { value: "instructor", label: "Instructor" },
                { value: "administrator", label: "Administrator" },
              ]}
            />
          </FormField>
        </FormSection>

        {children.length > 0 && (
          <FormSection title="Associated Children">
            <div className="sm:col-span-2 space-y-2">
              {children.map((child) => (
                <Link
                  key={child._id}
                  href={`/admin/students/${child._id}`}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
                >
                  <div>
                    <p className="font-medium text-white">{child.name}</p>
                    <p className="text-xs text-white/60">{child.email}</p>
                    {child.studentId && (
                      <p className="font-mono text-xs text-explore-teal">{child.studentId}</p>
                    )}
                  </div>
                  <span className="text-xs text-white/40">→</span>
                </Link>
              ))}
            </div>
          </FormSection>
        )}

        {guardians.length > 0 && (
          <FormSection title="Associated Guardians">
            <div className="sm:col-span-2 space-y-2">
              {guardians.map((guardian) => (
                <Link
                  key={guardian._id}
                  href={`/admin/users/${guardian._id}`}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
                >
                  <div>
                    <p className="font-medium text-white">{guardian.name}</p>
                    <p className="text-xs text-white/60">{guardian.email}</p>
                    {guardian.phone && (
                      <p className="text-xs text-white/40">{guardian.phone}</p>
                    )}
                  </div>
                  <span className="text-xs text-white/40">→</span>
                </Link>
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
            {isSubmitting ? "Saving…" : "Save Changes"}
          </button>

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
            className="rounded-lg border border-red-500/30 px-5 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
          >
            Delete
          </button>

          <Link
            href="/admin/users"
            className="rounded-lg border border-white/10 px-5 py-2 text-sm font-medium text-white/60 transition hover:text-white"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

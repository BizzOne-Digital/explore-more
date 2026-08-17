"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useRef } from "react";
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
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";

const schema = z.object({
  studentId: z.string().min(1, "Student is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  issueDate: z.string().min(1, "Issue date is required"),
  courseId: z.string().optional(),
  programId: z.string().optional(),
  eventId: z.string().optional(),
  fileType: z.enum(["image", "pdf"]),
  isShareable: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Student {
  _id: string;
  name: string;
  studentId?: string;
}

interface Course {
  _id: string;
  title: string;
}

interface Program {
  _id: string;
  title: string;
}

interface Event {
  _id: string;
  title: string;
}

export function CertificateForm({
  initialData,
  isNew = false,
  students = [],
  courses = [],
  programs = [],
  events = [],
}: {
  initialData?: Record<string, unknown> & { _id?: string };
  isNew?: boolean;
  students: Student[];
  courses: Course[];
  programs: Program[];
  events: Event[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filePath, setFilePath] = useState((initialData?.filePath as string) || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      studentId: (initialData?.studentId as string) ?? "",
      title: (initialData?.title as string) ?? "",
      description: (initialData?.description as string) ?? "",
      issueDate: initialData?.issueDate
        ? new Date(initialData.issueDate as string).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      courseId: (initialData?.courseId as string) ?? "",
      programId: (initialData?.programId as string) ?? "",
      eventId: (initialData?.eventId as string) ?? "",
      fileType: (initialData?.fileType as FormData["fileType"]) ?? "pdf",
      isShareable: (initialData?.isShareable as boolean) ?? false,
    },
  });

  const fileType = watch("fileType");

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    if (fileType === "image" && !isImage) {
      setError("Please select an image file");
      return;
    }

    if (fileType === "pdf" && !isPdf) {
      setError("Please select a PDF file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be less than 10MB");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "certificates");

      const res = await fetch("/api/upload/public", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "Upload failed");
        setUploading(false);
        return;
      }

      setFilePath(json.data.url);
      setUploading(false);
    } catch (err) {
      setError("Upload failed");
      setUploading(false);
    }
  }

  async function onSubmit(data: FormData) {
    setError(null);

    if (!filePath) {
      setError("Please upload a certificate file");
      return;
    }

    const payload = {
      ...data,
      issueDate: new Date(data.issueDate),
      filePath,
      courseId: data.courseId || undefined,
      programId: data.programId || undefined,
      eventId: data.eventId || undefined,
    };

    const url = isNew ? "/api/admin/certificates" : `/api/admin/certificates/${initialData?._id}`;
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
    router.push("/admin/certificates");
    router.refresh();
  }

  async function handleDelete() {
    if (!initialData?._id) return;
    if (!confirm("Are you sure you want to delete this certificate?")) return;

    try {
      const res = await fetch(`/api/admin/certificates/${initialData._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Delete failed");
        return;
      }
      router.push("/admin/certificates");
      router.refresh();
    } catch (err) {
      setError("Delete failed");
    }
  }

  return (
    <div>
      <PageHeader title={isNew ? "New Certificate" : "Edit Certificate"} />
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Student">
          <FormField label="Select Student" error={errors.studentId} required className="sm:col-span-2">
            <SelectInput
              registration={register("studentId")}
              error={errors.studentId}
              options={[
                { value: "", label: "Select a student..." },
                ...students.map((s) => ({
                  value: s._id,
                  label: `${s.name}${s.studentId ? ` (${s.studentId})` : ""}`,
                })),
              ]}
            />
          </FormField>
        </FormSection>

        <FormSection title="Certificate Details">
          <FormField label="Certificate Title" error={errors.title} required className="sm:col-span-2">
            <TextInput registration={register("title")} error={errors.title} placeholder="e.g., Certificate of Completion" />
          </FormField>
          <FormField label="Description" error={errors.description} className="sm:col-span-2">
            <TextArea registration={register("description")} error={errors.description} rows={3} placeholder="Additional details about this certificate..." />
          </FormField>
          <FormField label="Issue Date" error={errors.issueDate} required>
            <TextInput registration={register("issueDate")} error={errors.issueDate} type="date" />
          </FormField>
          <FormField label="File Type" error={errors.fileType} required>
            <SelectInput
              registration={register("fileType")}
              error={errors.fileType}
              options={[
                { value: "pdf", label: "PDF Document" },
                { value: "image", label: "Image (PNG/JPG)" },
              ]}
            />
          </FormField>
        </FormSection>

        <FormSection title="Associated With">
          <FormField label="Course" error={errors.courseId} hint="Optional">
            <SelectInput
              registration={register("courseId")}
              error={errors.courseId}
              options={[
                { value: "", label: "—" },
                ...courses.map((c) => ({ value: c._id, label: c.title })),
              ]}
            />
          </FormField>
          <FormField label="Program" error={errors.programId} hint="Optional">
            <SelectInput
              registration={register("programId")}
              error={errors.programId}
              options={[
                { value: "", label: "—" },
                ...programs.map((p) => ({ value: p._id, label: p.title })),
              ]}
            />
          </FormField>
          <FormField label="Event" error={errors.eventId} hint="Optional" className="sm:col-span-2">
            <SelectInput
              registration={register("eventId")}
              error={errors.eventId}
              options={[
                { value: "", label: "—" },
                ...events.map((e) => ({ value: e._id, label: e.title })),
              ]}
            />
          </FormField>
        </FormSection>

        <FormSection title="Certificate File">
          <div className="sm:col-span-2">
            {filePath ? (
              <div className="relative inline-block">
                {fileType === "image" ? (
                  <img
                    src={filePath}
                    alt="Certificate Preview"
                    className="h-64 w-auto rounded-lg border border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-64 w-96 flex-col items-center justify-center rounded-lg border border-white/10 bg-white/5">
                    <FileText className="h-16 w-16 text-white/40" />
                    <p className="mt-2 text-sm text-white/60">PDF Document</p>
                    <a
                      href={filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 text-xs text-explore-teal hover:underline"
                    >
                      View PDF
                    </a>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setFilePath("")}
                  className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white transition hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-white/5 transition hover:border-white/30 hover:bg-white/10"
              >
                {uploading ? (
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 animate-pulse text-white/40" />
                    <p className="mt-2 text-sm text-white/60">Uploading...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    {fileType === "image" ? (
                      <ImageIcon className="mx-auto h-8 w-8 text-white/40" />
                    ) : (
                      <FileText className="mx-auto h-8 w-8 text-white/40" />
                    )}
                    <p className="mt-2 text-sm text-white/60">
                      Click to upload {fileType === "image" ? "image" : "PDF"}
                    </p>
                    <p className="mt-1 text-xs text-white/40">
                      {fileType === "image" ? "PNG, JPG up to 10MB" : "PDF up to 10MB"}
                    </p>
                  </div>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={fileType === "image" ? "image/*" : "application/pdf"}
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </FormSection>

        <FormSection title="Settings">
          <div className="sm:col-span-2">
            <CheckboxInput registration={register("isShareable")} label="Allow student to share publicly" />
          </div>
        </FormSection>

        <div className="flex items-center gap-3 border-t border-white/10 pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-explore-lime px-5 py-2 text-sm font-semibold text-explore-black transition hover:bg-explore-lime/90 disabled:opacity-50"
          >
            {isSubmitting ? "Saving…" : "Save Certificate"}
          </button>

          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg border border-red-500/30 px-5 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
            >
              Delete
            </button>
          )}

          <Link
            href="/admin/certificates"
            className="rounded-lg border border-white/10 px-5 py-2 text-sm font-medium text-white/60 transition hover:text-white"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Upload, X, FileText, Image as ImageIcon, Search, CheckCircle2 } from "lucide-react";
import { getCertificateFileUrl } from "@/lib/certificates/display";

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
  publishToStudent: z.boolean(),
  grade: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Student {
  _id: string;
  name: string;
  studentId?: string;
}

interface AssociationOption {
  _id: string;
  title: string;
  startDate?: string;
}

function resolveInitialAssociationId(
  idValue: unknown,
  titleValue: unknown,
  options: AssociationOption[]
): string {
  if (typeof idValue === "string" && idValue) return idValue;
  if (idValue && typeof idValue === "object" && "_id" in idValue) {
    return String((idValue as { _id: unknown })._id);
  }
  if (typeof titleValue === "string" && titleValue.trim()) {
    const match = options.find((option) => option.title === titleValue.trim());
    if (match) return match._id;
  }
  return "";
}

export function CertificateForm({
  initialData,
  isNew = false,
  students = [],
  courses = [],
  programs = [],
  events = [],
  grade,
}: {
  initialData?: Record<string, unknown> & { _id?: string };
  isNew?: boolean;
  students: Student[];
  courses?: AssociationOption[];
  programs?: AssociationOption[];
  events?: AssociationOption[];
  grade?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [filePath, setFilePath] = useState((initialData?.filePath as string) || "");
  const [issueSearch, setIssueSearch] = useState("");
  const [selectedIssueStudents, setSelectedIssueStudents] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      studentId: String(initialData?.studentId ?? ""),
      title: (initialData?.title as string) ?? "",
      description: (initialData?.description as string) ?? "",
      issueDate: initialData?.issueDate
        ? new Date(initialData.issueDate as string).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      courseId: resolveInitialAssociationId(initialData?.courseId, initialData?.associatedCourse, courses),
      programId: resolveInitialAssociationId(initialData?.programId, initialData?.associatedProgram, programs),
      eventId: resolveInitialAssociationId(initialData?.eventId, initialData?.associatedEvent, events),
      fileType: (initialData?.fileType as FormData["fileType"]) ?? "pdf",
      isShareable: (initialData?.isShareable as boolean) ?? false,
      publishToStudent: Boolean(initialData?.publishedToStudent),
      grade: (initialData?.grade as string) ?? grade ?? "",
    },
  });

  const fileType = watch("fileType");
  const selectedStudentId = watch("studentId");
  const publishToStudent = watch("publishToStudent");

  const issueCandidates = useMemo(() => {
    const q = issueSearch.trim().toLowerCase();
    return students.filter((s) => {
      if (s._id === selectedStudentId) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || (s.studentId ?? "").toLowerCase().includes(q);
    });
  }, [students, issueSearch, selectedStudentId]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(file.name);
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (fileType === "image" && !isImage) {
      setError("Please select an image file");
      return;
    }

    if (fileType === "pdf" && !isPdf) {
      setError("Please select a PDF file (application/pdf)");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("PDF upload failed. Maximum file size is 50 MB.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", fileType);

      const res = await fetch("/api/admin/certificates/upload", {
        method: "POST",
        body: formData,
      });

      let json: { success?: boolean; error?: string; data?: { path?: string } };
      try {
        json = await res.json();
      } catch {
        setError(`Upload failed (${res.status}). Please try again.`);
        return;
      }

      if (!res.ok || !json.success) {
        setError(json.error ?? `Upload failed (${res.status})`);
        return;
      }

      if (!json.data?.path) {
        setError("Upload failed: server did not return a file path.");
        return;
      }

      setFilePath(json.data.path);
      setSuccess("Certificate file uploaded successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onSubmit(data: FormData) {
    setError(null);
    setSuccess(null);

    if (!filePath) {
      setError("Please upload a certificate file");
      return;
    }

    const payload = {
      ...data,
      issueDate: new Date(data.issueDate),
      filePath,
      courseId: data.courseId?.trim() || undefined,
      programId: data.programId?.trim() || undefined,
      eventId: data.eventId?.trim() || undefined,
      grade: data.grade?.trim() || grade || undefined,
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

    if (data.publishToStudent) {
      if (json.data?.publish?.notificationSent) {
        setSuccess("Certificate saved and published to the student account. Parent notified.");
      } else if (json.data?.publish?.error) {
        setSuccess(`Certificate saved and published to student. Parent notification: ${json.data.publish.error}`);
      } else {
        setSuccess("Certificate saved and published to the student account.");
      }
    } else {
      setSuccess("Certificate saved as draft. Check Publish to Student Account to release it.");
    }

    setTimeout(() => {
      router.push(
        grade ? `/admin/certificates?grade=${encodeURIComponent(grade)}` : "/admin/certificates"
      );
      router.refresh();
    }, 1500);
  }

  async function handlePublishNow() {
    if (!initialData?._id) return;
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/certificates/${initialData._id}/publish`, {
        method: "POST",
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Publish failed");
        return;
      }
      setValue("publishToStudent", true);
      setSuccess(
        json.data?.notificationSent
          ? "Certificate published and parent notified."
          : `Published to student. ${json.data?.error ?? "Parent notification pending."}`
      );
    } catch {
      setError("Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  async function handleIssueToMore() {
    if (!initialData?._id || selectedIssueStudents.length === 0) return;
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/certificates/${initialData._id}/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: selectedIssueStudents, publish: true }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Issue failed");
        return;
      }
      setSuccess(`Issued certificate to ${selectedIssueStudents.length} additional student(s).`);
      setSelectedIssueStudents([]);
    } catch {
      setError("Issue failed");
    } finally {
      setPublishing(false);
    }
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
    } catch {
      setError("Delete failed");
    }
  }

  const previewUrl = filePath ? getCertificateFileUrl(filePath) : "";

  return (
    <div>
      <PageHeader title={isNew ? "New Certificate" : "Edit Certificate"} />
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {success}
        </div>
      )}

      {!isNew && Boolean(initialData?.publishedToStudent) && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          <CheckCircle2 className="h-4 w-4" />
          Published to student account
          {Boolean(initialData?.notificationSent) ? " · Parent notified" : " · Parent notification pending"}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Assign Student">
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
            <TextArea registration={register("description")} error={errors.description} rows={3} />
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
          <FormField label="Course" error={errors.courseId}>
            <SelectInput
              registration={register("courseId")}
              error={errors.courseId}
              options={[
                { value: "", label: "Select a course..." },
                ...courses.map((course) => ({
                  value: course._id,
                  label: course.title,
                })),
              ]}
            />
          </FormField>
          <FormField label="Program" error={errors.programId}>
            <SelectInput
              registration={register("programId")}
              error={errors.programId}
              options={[
                { value: "", label: "Select a program..." },
                ...programs.map((program) => ({
                  value: program._id,
                  label: program.title,
                })),
              ]}
            />
          </FormField>
          <FormField label="Event" error={errors.eventId} className="sm:col-span-2">
            <SelectInput
              registration={register("eventId")}
              error={errors.eventId}
              options={[
                { value: "", label: "Select an event..." },
                ...events.map((event) => ({
                  value: event._id,
                  label: event.startDate
                    ? `${event.title} (${new Date(event.startDate).toLocaleDateString()})`
                    : event.title,
                })),
              ]}
            />
          </FormField>
        </FormSection>

        <FormSection title="Certificate File">
          <div className="sm:col-span-2">
            {filePath ? (
              <div className="relative inline-block">
                {fileType === "image" ? (
                  <img src={previewUrl} alt="Certificate Preview" className="h-64 w-auto rounded-lg border border-white/10 object-cover" />
                ) : (
                  <div className="flex h-64 w-96 flex-col items-center justify-center rounded-lg border border-white/10 bg-white/5">
                    <FileText className="h-16 w-16 text-white/40" />
                    <p className="mt-2 text-sm text-white/60">PDF Document</p>
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="mt-2 text-xs text-explore-teal hover:underline">
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
                    <p className="mt-2 text-sm text-white/60">Click to upload {fileType === "image" ? "image" : "PDF"}</p>
                    <p className="mt-1 text-xs text-white/40">PDF up to 50 MB</p>
                  </div>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={fileType === "image" ? "image/*" : "application/pdf,.pdf"}
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </FormSection>

        <FormSection title="Publish to Student Account">
          <div className="sm:col-span-2 space-y-3">
            <CheckboxInput
              registration={register("publishToStudent")}
              label="Publish to Student Account (visible in student & parent portals)"
            />
            {!isNew && !publishToStudent && (
              <button
                type="button"
                onClick={() => void handlePublishNow()}
                disabled={publishing}
                className="rounded-lg bg-explore-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {publishing ? "Publishing…" : "Publish Now & Notify Parent"}
              </button>
            )}
          </div>
        </FormSection>

        {!isNew && (
          <FormSection title="Issue Same Certificate to More Students">
            <FormField label="Search additional students" className="sm:col-span-2">
              <input
                type="text"
                value={issueSearch}
                onChange={(e) => setIssueSearch(e.target.value)}
                placeholder="Search by name or Student ID..."
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/40"
              />
            </FormField>
            <div className="sm:col-span-2 max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
              {issueCandidates.slice(0, 20).map((s) => (
                <label key={s._id} className="flex items-center gap-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={selectedIssueStudents.includes(s._id)}
                    onChange={(e) => {
                      setSelectedIssueStudents((prev) =>
                        e.target.checked ? [...prev, s._id] : prev.filter((id) => id !== s._id)
                      );
                    }}
                  />
                  {s.name}
                  {s.studentId ? ` (${s.studentId})` : ""}
                </label>
              ))}
            </div>
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={() => void handleIssueToMore()}
                disabled={publishing || selectedIssueStudents.length === 0}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Issue to Selected Students
              </button>
            </div>
          </FormSection>
        )}

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
            {isSubmitting ? "Saving…" : publishToStudent ? "Save & Publish" : "Save Certificate"}
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

          <Link href="/admin/certificates" className="rounded-lg border border-white/10 px-5 py-2 text-sm font-medium text-white/60 transition hover:text-white">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

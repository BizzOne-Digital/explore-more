"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { COMPANY } from "@/lib/constants";
import { COMMON_COURSES, GRADE_LEVELS } from "@/lib/resources/grades";
import type { CertificatePayload } from "@/lib/resources/types";
import type { CertificateTemplateId } from "@/lib/resources/certificate-templates";
import {
  LinkedStudentPicker,
  type LinkedStudentOption,
} from "@/components/resources/LinkedStudentPicker";
import {
  CertificateTemplatePicker,
  DEFAULT_CERTIFICATE_TEMPLATE_ID,
} from "@/components/resources/CertificateTemplatePicker";
import { CertificateTemplatePreview } from "@/components/resources/CertificateTemplatePreview";

const DEFAULT_FORM: CertificatePayload = {
  templateId: DEFAULT_CERTIFICATE_TEMPLATE_ID,
  studentName: "",
  achievement: "",
  homeschoolName: "",
  educatorName: "",
  dateAwarded: "",
};

type CertificateGeneratorFormProps = {
  linkedStudents?: LinkedStudentOption[];
  defaultHomeschoolName?: string;
};

export function CertificateGeneratorForm({
  linkedStudents = [],
  defaultHomeschoolName = "",
}: CertificateGeneratorFormProps) {
  const [form, setForm] = useState<CertificatePayload>({
    ...DEFAULT_FORM,
    homeschoolName: defaultHomeschoolName,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof CertificatePayload>(key: K, value: CertificatePayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function downloadPdf() {
    setError("");
    if (!form.studentName.trim()) {
      setError("Please enter the student's name.");
      return;
    }
    if (!form.achievement.trim()) {
      setError("Please enter a course name or grade level.");
      return;
    }
    if (!form.dateAwarded.trim()) {
      setError("Please enter the date completed.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/public/certificate/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Could not generate PDF");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${form.studentName.replace(/[^\w.-]+/g, "_") || "student"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setLoading(false);
    }
  }

  const achievementOptions = [
    { value: "", label: "Select or type below" },
    ...GRADE_LEVELS.map((grade) => ({ value: grade, label: grade })),
    ...COMMON_COURSES.map((course) => ({ value: course, label: course })),
  ];

  return (
    <div className="space-y-8">
      {linkedStudents.length > 0 && (
        <LinkedStudentPicker
          students={linkedStudents}
          onSelect={(child) =>
            setForm((prev) => ({
              ...prev,
              studentName: child.name,
              achievement: child.grade || prev.achievement,
            }))
          }
        />
      )}

      <section className="rounded-2xl border border-explore-charcoal/10 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-explore-teal">Step 1</p>
        <h2 className="mt-1 font-display text-2xl font-bold text-explore-charcoal">Choose a style</h2>
        <div className="mt-6">
          <CertificateTemplatePicker
            value={(form.templateId as CertificateTemplateId) || DEFAULT_CERTIFICATE_TEMPLATE_ID}
            onChange={(templateId) => update("templateId", templateId)}
          />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-explore-charcoal/10 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-explore-teal">Step 2</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-explore-charcoal">Student Information</h2>
          <p className="mt-2 text-sm text-explore-charcoal/70">
            Fill in your student&apos;s details, then download a printable certificate.
          </p>

          <div className="mt-6 space-y-4">
            <Input
              label="Student Name"
              required
              value={form.studentName}
              onChange={(e) => update("studentName", e.target.value)}
              placeholder="Jane Smith"
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-explore-charcoal">
                Grade or Course Completed<span className="ml-0.5 text-explore-orange">*</span>
              </label>
              <input
                list="achievement-suggestions"
                value={form.achievement}
                onChange={(e) => update("achievement", e.target.value)}
                placeholder="e.g. 5th Grade or Biology"
                className="w-full rounded-xl border border-explore-charcoal/15 bg-white px-4 py-2.5 text-sm text-explore-charcoal placeholder:text-explore-charcoal/40 transition-colors focus:border-explore-teal focus:outline-none focus:ring-2 focus:ring-explore-teal/20"
              />
              <datalist id="achievement-suggestions">
                {achievementOptions
                  .filter((o) => o.value)
                  .map((o) => (
                    <option key={o.value} value={o.value} />
                  ))}
              </datalist>
            </div>
            <Input
              label="Homeschool Name"
              value={form.homeschoolName}
              onChange={(e) => update("homeschoolName", e.target.value)}
              placeholder="Smith Homeschool"
            />
            <Input
              label="Teacher / Parent / Home Educator"
              value={form.educatorName || ""}
              onChange={(e) => update("educatorName", e.target.value)}
              placeholder="Parent or teacher name"
            />
            <Input
              label="Date Completed"
              required
              value={form.dateAwarded}
              onChange={(e) => update("dateAwarded", e.target.value)}
              placeholder="May 2026"
              helperText="e.g. May 2026 or June 15, 2026"
            />
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <div className="mt-8">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              disabled={loading}
              onClick={downloadPdf}
              className="w-full sm:w-auto"
            >
              <Download className="h-5 w-5" />
              {loading ? "Generating PDF…" : "Download Certificate PDF"}
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-explore-charcoal/10 bg-explore-cream/50 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-explore-teal">Preview</p>
          <div className="mt-4">
            <CertificateTemplatePreview form={form} />
          </div>
          <p className="mt-4 text-xs text-explore-charcoal/55">
            {COMPANY.name} provides this certificate template to support homeschooling families. The
            student&apos;s parent or guardian submits the information. {COMPANY.name} does not certify any
            grade or course completion status.
          </p>
        </section>
      </div>
    </div>
  );
}

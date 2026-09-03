"use client";

import { useMemo, useState } from "react";
import { Download, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { COMPANY } from "@/lib/constants";
import {
  COMMON_COURSES,
  GRADE_LEVELS,
  computeCourseDuration,
  computeTranscriptTotals,
  percentToLetter,
  suggestCredits,
  type TranscriptCourseInput,
} from "@/lib/resources/grades";
import type { TranscriptStudentInfo } from "@/lib/resources/types";

function emptyCourse(): TranscriptCourseInput {
  return {
    courseName: "",
    gradePercent: "",
    letterGrade: "",
    startDate: "",
    endDate: "",
    duration: "",
    credits: "",
  };
}

const DEFAULT_STUDENT: TranscriptStudentInfo = {
  studentName: "",
  dateOfBirth: "",
  gradeLevel: "",
  homeschoolName: "",
  schoolYear: "",
  curriculumSite: COMPANY.name,
  streetAddress: "",
  cityStateZip: "",
};

export function TranscriptGeneratorForm() {
  const [student, setStudent] = useState<TranscriptStudentInfo>(DEFAULT_STUDENT);
  const [courses, setCourses] = useState<TranscriptCourseInput[]>([emptyCourse(), emptyCourse(), emptyCourse()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totals = useMemo(() => computeTranscriptTotals(courses), [courses]);

  function updateStudent<K extends keyof TranscriptStudentInfo>(key: K, value: TranscriptStudentInfo[K]) {
    setStudent((prev) => ({ ...prev, [key]: value }));
  }

  function updateCourse(index: number, patch: Partial<TranscriptCourseInput>) {
    setCourses((prev) =>
      prev.map((course, i) => {
        if (i !== index) return course;
        const next = { ...course, ...patch };

        if ("gradePercent" in patch && patch.gradePercent !== undefined) {
          const percent = parseFloat(patch.gradePercent);
          if (!Number.isNaN(percent)) {
            next.letterGrade = percentToLetter(percent);
          }
        }

        if ("startDate" in patch || "endDate" in patch) {
          const duration = computeCourseDuration(next.startDate, next.endDate);
          if (duration) {
            next.duration = duration;
            if (!next.credits) {
              const suggested = suggestCredits(duration);
              if (suggested) next.credits = suggested;
            }
          }
        }

        return next;
      })
    );
  }

  function addCourse() {
    setCourses((prev) => [...prev, emptyCourse()]);
  }

  function removeCourse(index: number) {
    setCourses((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function downloadPdf() {
    setError("");
    if (!student.studentName.trim()) {
      setError("Please enter the student's name.");
      return;
    }

    const namedCourses = courses.filter((c) => c.courseName.trim());
    if (namedCourses.length === 0) {
      setError("Add at least one course.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/public/transcript/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student, courses }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Could not generate PDF");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transcript-${student.studentName.replace(/[^\w.-]+/g, "_") || "student"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-explore-charcoal/10 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-explore-teal">Step 1</p>
        <h2 className="mt-1 font-display text-2xl font-bold text-explore-charcoal">Student &amp; School Information</h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Input
            label="Student Name"
            required
            value={student.studentName}
            onChange={(e) => updateStudent("studentName", e.target.value)}
            placeholder="Jane Smith"
          />
          <Input
            label="Date of Birth"
            type="date"
            value={student.dateOfBirth}
            onChange={(e) => updateStudent("dateOfBirth", e.target.value)}
          />
          <Select
            label="Grade Level"
            value={student.gradeLevel}
            onChange={(e) => updateStudent("gradeLevel", e.target.value)}
            options={[
              { value: "", label: "Select grade" },
              ...GRADE_LEVELS.map((grade) => ({ value: grade, label: grade })),
            ]}
          />
          <Input
            label="School Year"
            value={student.schoolYear}
            onChange={(e) => updateStudent("schoolYear", e.target.value)}
            placeholder="2025–2026"
          />
          <Input
            label="Homeschool Name"
            value={student.homeschoolName}
            onChange={(e) => updateStudent("homeschoolName", e.target.value)}
            placeholder="Smith Homeschool"
            helperText="Many families use their last name, e.g. “Smith Homeschool.”"
          />
          <Input
            label="Curriculum / Program"
            value={student.curriculumSite}
            onChange={(e) => updateStudent("curriculumSite", e.target.value)}
            placeholder={COMPANY.name}
          />
          <Input
            label="Street Address"
            value={student.streetAddress}
            onChange={(e) => updateStudent("streetAddress", e.target.value)}
            className="sm:col-span-2"
          />
          <Input
            label="City, State, Zip"
            value={student.cityStateZip}
            onChange={(e) => updateStudent("cityStateZip", e.target.value)}
            className="sm:col-span-2"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-explore-charcoal/10 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-explore-teal">Step 2</p>
        <h2 className="mt-1 font-display text-2xl font-bold text-explore-charcoal">Enter Courses</h2>
        <p className="mt-2 text-sm text-explore-charcoal/70">
          Add each course with the grade, dates, and credits. Letter grades update automatically from the
          percentage — you can edit them if needed.
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-explore-charcoal/10 bg-explore-cream/60 text-left text-xs uppercase tracking-wide text-explore-charcoal/70">
                <th className="px-2 py-2 w-8">#</th>
                <th className="px-2 py-2">Course Name</th>
                <th className="px-2 py-2 w-20">Grade %</th>
                <th className="px-2 py-2 w-16">Letter</th>
                <th className="px-2 py-2 w-32">Start</th>
                <th className="px-2 py-2 w-32">End</th>
                <th className="px-2 py-2 w-28">Duration</th>
                <th className="px-2 py-2 w-20">Credits</th>
                <th className="px-2 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {courses.map((course, index) => (
                <tr key={index} className="border-b border-explore-charcoal/5 align-top">
                  <td className="px-2 py-2 text-explore-charcoal/50">{index + 1}</td>
                  <td className="px-2 py-2">
                    <input
                      list="course-suggestions"
                      value={course.courseName}
                      onChange={(e) => updateCourse(index, { courseName: e.target.value })}
                      placeholder="Course name"
                      className="w-full rounded-lg border border-explore-charcoal/15 px-2 py-1.5 text-sm focus:border-explore-teal focus:outline-none focus:ring-2 focus:ring-explore-teal/20"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={course.gradePercent}
                      onChange={(e) => updateCourse(index, { gradePercent: e.target.value })}
                      className="w-full rounded-lg border border-explore-charcoal/15 px-2 py-1.5 text-sm focus:border-explore-teal focus:outline-none focus:ring-2 focus:ring-explore-teal/20"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={course.letterGrade}
                      onChange={(e) => updateCourse(index, { letterGrade: e.target.value })}
                      className="w-full rounded-lg border border-explore-charcoal/15 px-2 py-1.5 text-sm focus:border-explore-teal focus:outline-none focus:ring-2 focus:ring-explore-teal/20"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="date"
                      value={course.startDate}
                      onChange={(e) => updateCourse(index, { startDate: e.target.value })}
                      className="w-full rounded-lg border border-explore-charcoal/15 px-2 py-1.5 text-sm focus:border-explore-teal focus:outline-none focus:ring-2 focus:ring-explore-teal/20"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="date"
                      value={course.endDate}
                      onChange={(e) => updateCourse(index, { endDate: e.target.value })}
                      className="w-full rounded-lg border border-explore-charcoal/15 px-2 py-1.5 text-sm focus:border-explore-teal focus:outline-none focus:ring-2 focus:ring-explore-teal/20"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={course.duration}
                      onChange={(e) => updateCourse(index, { duration: e.target.value })}
                      placeholder="Semester"
                      className="w-full rounded-lg border border-explore-charcoal/15 px-2 py-1.5 text-sm focus:border-explore-teal focus:outline-none focus:ring-2 focus:ring-explore-teal/20"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={course.credits}
                      onChange={(e) => updateCourse(index, { credits: e.target.value })}
                      placeholder="1.0"
                      className="w-full rounded-lg border border-explore-charcoal/15 px-2 py-1.5 text-sm focus:border-explore-teal focus:outline-none focus:ring-2 focus:ring-explore-teal/20"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() => removeCourse(index)}
                      className="rounded p-1 text-explore-charcoal/40 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove course"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <datalist id="course-suggestions">
            {COMMON_COURSES.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        <button
          type="button"
          onClick={addCourse}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-explore-teal hover:underline"
        >
          <Plus className="h-4 w-4" />
          Add Course
        </button>

        <div className="mt-8 flex flex-wrap gap-6 rounded-xl bg-explore-cream/80 p-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-explore-charcoal/60">Total Credits</p>
            <p className="font-display text-2xl font-bold text-explore-teal">{totals.totalCredits.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-explore-charcoal/60">Cumulative GPA (4.0 scale)</p>
            <p className="font-display text-2xl font-bold text-explore-teal">{totals.cumulativeGpa.toFixed(2)}</p>
          </div>
        </div>

        <p className="mt-4 text-xs text-explore-charcoal/55">
          1 credit = full-year course · 0.5 credits = half-year course. GPA is calculated on an unweighted 4.0
          scale. Check your state&apos;s homeschool requirements.
        </p>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-center">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          disabled={loading}
          onClick={downloadPdf}
          className="min-w-[240px]"
        >
          <Download className="h-5 w-5" />
          {loading ? "Generating PDF…" : "Download Transcript PDF"}
        </Button>
      </div>
    </div>
  );
}

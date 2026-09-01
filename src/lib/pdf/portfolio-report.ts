import connectDB from "@/lib/db";
import {
  HomeschoolPortfolio,
  PortfolioActivity,
  PortfolioAttendance,
  PortfolioCurriculum,
  PortfolioReadingEntry,
  PortfolioWorkSample,
  StudentProfile,
  User,
} from "@/models";
import {
  ATTENDANCE_TYPE_LABELS,
  PORTFOLIO_STATUS_LABELS,
  PROGRESS_MARKER_LABELS,
  READING_TYPE_LABELS,
  type AttendanceType,
  type ProgressMarker,
  type ReadingResourceType,
} from "@/lib/portfolio/constants";
import { getPortfolioStats } from "@/lib/queries/portfolio";
import { AcademyReport, formatReportDate, formatShortDate } from "@/lib/pdf/academy-report";

export type PortfolioReportData = {
  studentName: string;
  studentIdCode?: string;
  grade?: string;
  schoolYear: string;
  portfolioStatus: string;
  stats: Awaited<ReturnType<typeof getPortfolioStats>>;
  workSamples: Array<{
    subject: string;
    assignmentName: string;
    dateCompleted: Date;
    description?: string;
    progressMarker: string;
    files: string[];
  }>;
  reading: Array<{
    bookTitle: string;
    author?: string;
    subject?: string;
    resourceType: string;
    dateStarted?: Date;
    dateCompleted?: Date;
    notes?: string;
  }>;
  activities: Array<{
    category: string;
    activityName: string;
    date: Date;
    subject?: string;
    location?: string;
    learned?: string;
    hours?: number;
    files: string[];
  }>;
  curriculum: Array<{
    subject: string;
    materialName: string;
    description?: string;
    files: string[];
  }>;
  instructionLog: Array<{
    date: Date;
    type: string;
    notes?: string;
  }>;
  fileManifest: string[];
};

export async function getPortfolioReportData(portfolioId: string): Promise<PortfolioReportData | null> {
  await connectDB();
  const portfolio = await HomeschoolPortfolio.findById(portfolioId);
  if (!portfolio) return null;

  const [student, profile, stats, workSamples, reading, activities, curriculum, attendance] =
    await Promise.all([
      User.findById(portfolio.studentId).select("name studentId").lean(),
      StudentProfile.findOne({ userId: portfolio.studentId }).select("grade ageRange").lean(),
      getPortfolioStats(portfolioId),
      PortfolioWorkSample.find({ portfolioId }).sort({ dateCompleted: -1 }).lean(),
      PortfolioReadingEntry.find({ portfolioId }).sort({ dateCompleted: -1, dateStarted: -1 }).lean(),
      PortfolioActivity.find({ portfolioId }).sort({ date: -1 }).lean(),
      PortfolioCurriculum.find({ portfolioId }).sort({ subject: 1 }).lean(),
      PortfolioAttendance.find({ portfolioId }).sort({ date: -1 }).lean(),
    ]);

  const fileManifest: string[] = [];

  const mappedWorkSamples = workSamples.map((sample) => {
    for (const file of sample.files) {
      fileManifest.push(`work-samples/${file.originalName}`);
    }
    return {
      subject: sample.subject,
      assignmentName: sample.assignmentName,
      dateCompleted: sample.dateCompleted,
      description: sample.description,
      progressMarker: PROGRESS_MARKER_LABELS[sample.progressMarker as ProgressMarker] ?? sample.progressMarker,
      files: sample.files.map((f) => f.originalName),
    };
  });

  const mappedReading = reading.map((entry) => ({
    bookTitle: entry.bookTitle,
    author: entry.author,
    subject: entry.subject,
    resourceType: READING_TYPE_LABELS[entry.resourceType as ReadingResourceType] ?? entry.resourceType,
    dateStarted: entry.dateStarted,
    dateCompleted: entry.dateCompleted,
    notes: entry.notes,
  }));

  const mappedActivities = activities.map((activity) => {
    for (const file of activity.files) {
      fileManifest.push(`activities/${file.originalName}`);
    }
    return {
      category: activity.category,
      activityName: activity.activityName,
      date: activity.date,
      subject: activity.subject,
      location: activity.location,
      learned: activity.learned,
      hours: activity.hours,
      files: activity.files.map((f) => f.originalName),
    };
  });

  const mappedCurriculum = curriculum.map((item) => {
    for (const file of item.files) {
      fileManifest.push(`curriculum/${item.materialName.replace(/[^\w.-]+/g, "_")}/${file.originalName}`);
    }
    return {
      subject: item.subject,
      materialName: item.materialName,
      description: item.description,
      files: item.files.map((f) => f.originalName),
    };
  });

  const mappedInstruction = attendance.map((record) => ({
    date: record.date,
    type: ATTENDANCE_TYPE_LABELS[record.type as AttendanceType] ?? record.type,
    notes: record.notes,
  }));

  return {
    studentName: student?.name ?? "Student",
    studentIdCode: student?.studentId,
    grade: profile?.grade || profile?.ageRange,
    schoolYear: portfolio.schoolYear,
    portfolioStatus: PORTFOLIO_STATUS_LABELS[portfolio.status] ?? portfolio.status,
    stats,
    workSamples: mappedWorkSamples,
    reading: mappedReading,
    activities: mappedActivities,
    curriculum: mappedCurriculum,
    instructionLog: mappedInstruction,
    fileManifest,
  };
}

export async function generatePortfolioSummaryPdf(data: PortfolioReportData): Promise<Uint8Array> {
  const report = await AcademyReport.create(
    "Homeschool Portfolio Report",
    `${data.studentName} • ${data.schoolYear}`
  );

  report.drawMetaBlock([
    { label: "Student", value: data.studentName },
    ...(data.studentIdCode ? [{ label: "Student ID", value: data.studentIdCode }] : []),
    ...(data.grade ? [{ label: "Grade", value: data.grade }] : []),
    { label: "School Year", value: data.schoolYear },
    { label: "Portfolio Status", value: data.portfolioStatus },
    { label: "Generated", value: formatReportDate() },
  ]);

  report.drawSummaryCards([
    { label: "Work Samples", value: String(data.stats.workSampleCount) },
    { label: "Reading Entries", value: String(data.stats.readingCount) },
    { label: "Activities", value: String(data.stats.activityCount) },
    { label: "Instruction Days", value: String(data.stats.instructionDays) },
  ]);

  report.drawSectionTitle("Work Samples");
  report.drawTable(
    [
      { header: "Subject", width: 110 },
      { header: "Assignment", width: 130 },
      { header: "Date", width: 72 },
      { header: "Progress", width: 80 },
      { header: "Details", width: 172 },
    ],
    data.workSamples.map((sample) => [
      sample.subject,
      sample.assignmentName,
      formatShortDate(sample.dateCompleted),
      sample.progressMarker,
      [sample.description, sample.files.length ? `Files: ${sample.files.join(", ")}` : ""]
        .filter(Boolean)
        .join(" • "),
    ])
  );

  report.drawSectionTitle("Reading & Resources");
  report.drawTable(
    [
      { header: "Title", width: 140 },
      { header: "Author", width: 90 },
      { header: "Type", width: 72 },
      { header: "Dates", width: 90 },
      { header: "Notes", width: 172 },
    ],
    data.reading.map((entry) => [
      entry.bookTitle,
      entry.author ?? "—",
      entry.resourceType,
      [formatShortDate(entry.dateStarted), formatShortDate(entry.dateCompleted)].filter((d) => d !== "—").join(" – ") || "—",
      [entry.subject, entry.notes].filter(Boolean).join(" • ") || "—",
    ])
  );

  report.drawSectionTitle("Learning Activities");
  report.drawTable(
    [
      { header: "Category", width: 100 },
      { header: "Activity", width: 120 },
      { header: "Date", width: 72 },
      { header: "Subject", width: 80 },
      { header: "Details", width: 192 },
    ],
    data.activities.map((activity) => [
      activity.category,
      activity.activityName,
      formatShortDate(activity.date),
      activity.subject ?? "—",
      [
        activity.location ? `Location: ${activity.location}` : "",
        activity.learned ? `Learned: ${activity.learned}` : "",
        activity.hours ? `Hours: ${activity.hours}` : "",
        activity.files.length ? `Files: ${activity.files.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join(" • "),
    ])
  );

  report.drawSectionTitle("Curriculum Materials");
  report.drawTable(
    [
      { header: "Subject", width: 120 },
      { header: "Material", width: 150 },
      { header: "Description", width: 194 },
      { header: "Files", width: 100 },
    ],
    data.curriculum.map((item) => [
      item.subject,
      item.materialName,
      item.description ?? "—",
      item.files.join(", ") || "—",
    ])
  );

  report.drawSectionTitle("Instruction & Attendance Log");
  report.drawTable(
    [
      { header: "Date", width: 100 },
      { header: "Type", width: 140 },
      { header: "Notes", width: 324 },
    ],
    data.instructionLog.map((record) => [
      formatShortDate(record.date),
      record.type,
      record.notes ?? "—",
    ])
  );

  if (data.fileManifest.length > 0) {
    report.drawSectionTitle("Attached Files (included in ZIP export)");
    report.drawParagraph(data.fileManifest.map((path, index) => `${index + 1}. ${path}`).join("\n"), {
      size: 8,
      muted: true,
    });
  }

  report.drawParagraph(
    "This report summarizes homeschool portfolio records maintained by the parent/guardian in the Explore More Academy parent portal. Original uploaded documents are preserved separately in the portfolio file archive.",
    { muted: true, size: 8 }
  );

  return report.finalize();
}

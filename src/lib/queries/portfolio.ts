import connectDB from "@/lib/db";
import {
  HomeschoolPortfolio,
  PortfolioActivity,
  PortfolioAttendance,
  PortfolioCurriculum,
  PortfolioReadingEntry,
  PortfolioReviewRequest,
  PortfolioWorkSample,
} from "@/models";
import {
  PORTFOLIO_SUBJECTS,
  type PortfolioStatus,
  type PortfolioSubject,
} from "@/lib/portfolio/constants";

export interface PortfolioStats {
  workSampleCount: number;
  readingCount: number;
  activityCount: number;
  curriculumCount: number;
  instructionDays: number;
  subjectCounts: Record<string, number>;
  progressMarkers: {
    beginning: number;
    middle: number;
    end: number;
  };
  openReviewRequests: number;
}

export interface PortfolioReadiness {
  percentComplete: number;
  checks: Array<{ label: string; complete: boolean; warning?: boolean }>;
}

export async function getOrCreatePortfolio(
  studentId: string,
  guardianId: string,
  schoolYear: string
) {
  await connectDB();
  let portfolio = await HomeschoolPortfolio.findOne({ studentId, schoolYear });
  if (!portfolio) {
    portfolio = await HomeschoolPortfolio.create({
      studentId,
      guardianId,
      schoolYear,
      status: "draft",
    });
  }
  return portfolio;
}

export async function getPortfolioStats(portfolioId: string): Promise<PortfolioStats> {
  await connectDB();
  const pid = portfolioId;

  const [workSamples, reading, activities, curriculum, attendance, openRequests] =
    await Promise.all([
      PortfolioWorkSample.find({ portfolioId: pid }),
      PortfolioReadingEntry.find({ portfolioId: pid }),
      PortfolioActivity.find({ portfolioId: pid }),
      PortfolioCurriculum.find({ portfolioId: pid }),
      PortfolioAttendance.find({ portfolioId: pid }),
      PortfolioReviewRequest.countDocuments({ portfolioId: pid, status: "open" }),
    ]);

  const subjectCounts: Record<string, number> = {};
  for (const subject of PORTFOLIO_SUBJECTS) {
    subjectCounts[subject] = 0;
  }
  for (const sample of workSamples) {
    subjectCounts[sample.subject] = (subjectCounts[sample.subject] ?? 0) + 1;
  }

  const instructionDays = attendance.filter((a) =>
    ["present", "instruction", "field_trip", "educational_activity"].includes(a.type)
  ).length;

  const progressMarkers = {
    beginning: workSamples.filter((s) => s.progressMarker === "beginning_of_year").length,
    middle: workSamples.filter((s) => s.progressMarker === "middle_of_year").length,
    end: workSamples.filter((s) => s.progressMarker === "end_of_year").length,
  };

  return {
    workSampleCount: workSamples.length,
    readingCount: reading.length,
    activityCount: activities.length,
    curriculumCount: curriculum.length,
    instructionDays,
    subjectCounts,
    progressMarkers,
    openReviewRequests: openRequests,
  };
}

const CORE_SUBJECTS: PortfolioSubject[] = [
  "Language Arts / English",
  "Mathematics",
  "Science",
  "Social Studies",
];

export function computePortfolioReadiness(stats: PortfolioStats): PortfolioReadiness {
  const checks = [
    {
      label: "Math Evidence",
      complete: (stats.subjectCounts["Mathematics"] ?? 0) >= 3,
    },
    {
      label: "Language Arts Evidence",
      complete: (stats.subjectCounts["Language Arts / English"] ?? 0) >= 3,
    },
    {
      label: "Science Evidence",
      complete: (stats.subjectCounts["Science"] ?? 0) >= 2,
    },
    {
      label: "Social Studies Evidence",
      complete: (stats.subjectCounts["Social Studies"] ?? 0) >= 2,
    },
    {
      label: "Reading List",
      complete: stats.readingCount >= 3,
    },
    {
      label: "Curriculum List",
      complete: stats.curriculumCount >= 4,
    },
    {
      label: "Beginning/End Progress Samples",
      complete: stats.progressMarkers.beginning >= 1 && stats.progressMarkers.end >= 1,
      warning: stats.progressMarkers.beginning < 1 || stats.progressMarkers.end < 1,
    },
    {
      label: "Activity Log Updated",
      complete: stats.activityCount >= 3,
      warning: stats.activityCount < 3,
    },
    {
      label: "Attendance Recorded",
      complete: stats.instructionDays >= 10,
      warning: stats.instructionDays < 10,
    },
  ];

  const completeCount = checks.filter((c) => c.complete).length;
  const percentComplete = Math.round((completeCount / checks.length) * 100);

  return { percentComplete, checks };
}

export function canSubmitPortfolio(stats: PortfolioStats): boolean {
  const readiness = computePortfolioReadiness(stats);
  const coreSubjectsReady = CORE_SUBJECTS.every(
    (s) => (stats.subjectCounts[s] ?? 0) >= 2
  );
  return readiness.percentComplete >= 60 && coreSubjectsReady && stats.workSampleCount >= 5;
}

export function statusLabel(status: PortfolioStatus): string {
  const labels: Record<PortfolioStatus, string> = {
    draft: "In Progress",
    submitted: "Submitted",
    under_review: "Under Review",
    additional_docs_requested: "Additional Documentation Requested",
    completed: "Portfolio Review Completed",
  };
  return labels[status];
}

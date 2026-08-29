export const PORTFOLIO_SUBJECTS = [
  "Language Arts / English",
  "Mathematics",
  "Science",
  "Social Studies",
  "Health",
  "Physical Education",
  "Art",
  "Music",
  "Technology / Computer Studies",
  "Electives",
  "Field Trips",
  "Miscellaneous",
] as const;

export type PortfolioSubject = (typeof PORTFOLIO_SUBJECTS)[number];

export const PROGRESS_MARKERS = [
  "none",
  "beginning_of_year",
  "middle_of_year",
  "end_of_year",
] as const;

export type ProgressMarker = (typeof PROGRESS_MARKERS)[number];

export const PROGRESS_MARKER_LABELS: Record<ProgressMarker, string> = {
  none: "None",
  beginning_of_year: "Beginning of Year",
  middle_of_year: "Middle of Year",
  end_of_year: "End of Year",
};

export const READING_RESOURCE_TYPES = [
  "book",
  "textbook",
  "online_program",
  "audiobook",
  "other",
] as const;

export type ReadingResourceType = (typeof READING_RESOURCE_TYPES)[number];

export const READING_TYPE_LABELS: Record<ReadingResourceType, string> = {
  book: "Book",
  textbook: "Textbook",
  online_program: "Online Program",
  audiobook: "Audiobook",
  other: "Other",
};

export const ACTIVITY_CATEGORIES = [
  "Field Trips",
  "Science Experiments",
  "Museum Visits",
  "Nature Studies",
  "Community Service",
  "Educational Events",
  "Art Projects",
  "STEM Projects",
  "Physical Education",
  "Music",
  "Educational Travel",
  "Library Visits",
  "Clubs/Co-ops",
  "Other Activities",
] as const;

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export const ATTENDANCE_TYPES = [
  "present",
  "instruction",
  "field_trip",
  "educational_activity",
  "holiday",
] as const;

export type AttendanceType = (typeof ATTENDANCE_TYPES)[number];

export const ATTENDANCE_TYPE_LABELS: Record<AttendanceType, string> = {
  present: "Present",
  instruction: "Instruction Day",
  field_trip: "Field Trip",
  educational_activity: "Educational Activity",
  holiday: "Holiday / Break",
};

export const PORTFOLIO_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "additional_docs_requested",
  "completed",
] as const;

export type PortfolioStatus = (typeof PORTFOLIO_STATUSES)[number];

export const PORTFOLIO_STATUS_LABELS: Record<PortfolioStatus, string> = {
  draft: "In Progress",
  submitted: "Submitted",
  under_review: "Under Review",
  additional_docs_requested: "Additional Documentation Requested",
  completed: "Portfolio Review Completed",
};

export const STAFF_CATEGORIES = [
  "portfolio_reviewer",
  "tutor",
  "homeschool_support",
  "administration",
] as const;

export type StaffCategory = (typeof STAFF_CATEGORIES)[number];

export const STAFF_CATEGORY_LABELS: Record<StaffCategory, string> = {
  portfolio_reviewer: "Portfolio Reviewer",
  tutor: "Tutor",
  homeschool_support: "Homeschool Support",
  administration: "Administration",
};

export const NOTIFICATION_PRIORITIES = ["normal", "important", "urgent"] as const;
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

export const NOTIFICATION_AUDIENCES = [
  "all_parents",
  "portfolio_parents",
  "tutoring_parents",
  "custom",
] as const;

export type NotificationAudience = (typeof NOTIFICATION_AUDIENCES)[number];

export function getSchoolYearOptions(): string[] {
  const currentYear = new Date().getFullYear();
  const month = new Date().getMonth();
  const startYear = month >= 7 ? currentYear : currentYear - 1;
  return Array.from({ length: 5 }, (_, i) => {
    const y = startYear - i;
    return `${y}–${y + 1}`;
  });
}

export function formatSchoolYearLabel(year: string): string {
  return year.replace("–", "-");
}

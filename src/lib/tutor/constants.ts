export const TUTOR_RESOURCE_TYPES = [
  "worksheet",
  "homework",
  "study_guide",
  "reading",
  "lesson_notes",
  "practice_test",
  "pdf",
  "image",
  "link",
  "video",
  "other",
] as const;

export type TutorResourceType = (typeof TUTOR_RESOURCE_TYPES)[number];

export const TUTOR_RESOURCE_TYPE_LABELS: Record<TutorResourceType, string> = {
  worksheet: "Worksheet",
  homework: "Homework",
  study_guide: "Study Guide",
  reading: "Reading Assignment",
  lesson_notes: "Lesson Notes",
  practice_test: "Practice Test",
  pdf: "PDF Document",
  image: "Image",
  link: "Link",
  video: "Video",
  other: "Other",
};

export const STAFF_MESSAGE_CATEGORIES = [
  "administration",
  "academic_support",
  "tutor_support",
  "technical_support",
  "peer_tutor",
] as const;

export type StaffMessageCategory = (typeof STAFF_MESSAGE_CATEGORIES)[number];

export const STAFF_MESSAGE_CATEGORY_LABELS: Record<StaffMessageCategory, string> = {
  administration: "Administration",
  academic_support: "Academic Support",
  tutor_support: "Tutor Support",
  technical_support: "Technical Support",
  peer_tutor: "Other Tutors",
};

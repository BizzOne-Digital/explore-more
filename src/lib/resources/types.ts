import type { TranscriptCourseInput } from "@/lib/resources/grades";

export type TranscriptStudentInfo = {
  studentName: string;
  dateOfBirth: string;
  gradeLevel: string;
  homeschoolName: string;
  schoolYear: string;
  curriculumSite: string;
  streetAddress: string;
  cityStateZip: string;
};

export type TranscriptPayload = {
  student: TranscriptStudentInfo;
  courses: TranscriptCourseInput[];
};

export type CertificatePayload = {
  studentName: string;
  achievement: string;
  homeschoolName: string;
  dateAwarded: string;
};

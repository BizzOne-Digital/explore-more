import type { DocumentType, TranscriptCourseInput } from "@/lib/resources/grades";

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
  documentType?: DocumentType;
  student: TranscriptStudentInfo;
  courses: TranscriptCourseInput[];
};

import type { CertificateFieldStylesMap } from "@/lib/resources/certificate-fields";

export type CertificatePayload = {
  templateId?: string;
  studentName: string;
  achievement: string;
  homeschoolName: string;
  educatorName?: string;
  dateAwarded: string;
  /** Parent-adjusted positions and typography (optional). */
  fieldStyles?: CertificateFieldStylesMap;
};

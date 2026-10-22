import type { WorkspaceRecordType } from "@/models/TeacherWorkspace";

export type WorkspacePageKind =
  | "classroom"
  | "lesson-plans"
  | "planner"
  | "attendance"
  | "gradebook"
  | "assessments"
  | "records"
  | "todos"
  | "inventory"
  | "field-trips"
  | "standards"
  | "end-of-day"
  | "documents"
  | "placeholder"
  | "calendar"
  | "help"
  | "substitute"
  | "student-progress"
  | "reports-hub";

export interface WorkspacePageConfig {
  title: string;
  description: string;
  kind: WorkspacePageKind;
  recordType?: WorkspaceRecordType;
  documentFolder?: string;
  placeholderLinks?: { href: string; label: string }[];
}

export const WORKSPACE_PAGE_CONFIG: Record<string, WorkspacePageConfig> = {
  classroom: {
    title: "My Classroom",
    description: "Class profile, routines, rules, and supply lists for your homeroom or teaching space.",
    kind: "classroom",
  },
  planner: {
    title: "Teacher Planner",
    description: "Daily and weekly planning blocks tied to your school year.",
    kind: "planner",
  },
  calendar: {
    title: "Calendar & Schedule",
    description: "Your teaching calendar and student session schedules.",
    kind: "calendar",
  },
  "lesson-plans": {
    title: "Lesson Plans",
    description: "Create, teach, and reflect on lesson plans with objectives and materials.",
    kind: "lesson-plans",
  },
  curriculum: {
    title: "Curriculum & Standards",
    description: "Track standard coverage and pacing across subjects.",
    kind: "standards",
  },
  attendance: {
    title: "Attendance",
    description: "Mark daily attendance for students assigned to you.",
    kind: "attendance",
  },
  gradebook: {
    title: "Gradebook",
    description: "Assignments, categories, and scores for your class.",
    kind: "gradebook",
  },
  assessments: {
    title: "Assessments",
    description: "Track assessments by student with scores, dates, and notes.",
    kind: "assessments",
  },
  goals: {
    title: "Student Goals",
    description: "SMART goals and progress notes for individual students.",
    kind: "records",
    recordType: "goal",
  },
  interventions: {
    title: "Interventions",
    description: "Intervention plans, check-ins, and follow-up dates.",
    kind: "records",
    recordType: "intervention",
  },
  behavior: {
    title: "Behavior & Incidents",
    description: "Document behavior events and restorative follow-up.",
    kind: "records",
    recordType: "behavior",
  },
  notes: {
    title: "Teacher Notes",
    description: "Private teacher notes about students or class events.",
    kind: "records",
    recordType: "note",
  },
  portfolios: {
    title: "Student Portfolios",
    description: "Roster progress summary synced with gradebook, assessments, and records.",
    kind: "student-progress",
  },
  inventory: {
    title: "Classroom Inventory",
    description: "Track materials, quantities, and asset numbers.",
    kind: "inventory",
  },
  "field-trips": {
    title: "Field Trips & Activities",
    description: "Plan trips, checklists, and post-trip reflections.",
    kind: "field-trips",
  },
  substitute: {
    title: "Substitute Center",
    description: "Sub-ready classroom info, today’s planner blocks, and lesson plans in one place.",
    kind: "substitute",
  },
  progress: {
    title: "Student Progress",
    description: "Open a student profile to review goals, attendance, grades, and notes.",
    kind: "student-progress",
  },
  help: {
    title: "Help & Training",
    description: "Portal guides, FAQs, and support for Explore More Academy teachers.",
    kind: "help",
  },
  reports: {
    title: "Reports",
    description: "Progress and academy reports (use Progress Reports for published cards).",
    kind: "reports-hub",
  },
  documents: {
    title: "Teacher Documents",
    description: "Store links and references to your teaching documents.",
    kind: "documents",
    documentFolder: "Documents",
  },
  professional: {
    title: "Professional Records",
    description: "Certifications, evaluations, and HR-related document references.",
    kind: "documents",
    documentFolder: "Professional",
  },
  "professional-development": {
    title: "Professional Development",
    description: "PD hours, workshops, and training notes.",
    kind: "documents",
    documentFolder: "Professional Development",
  },
  files: {
    title: "File Center",
    description: "All uploaded workspace file references in one place.",
    kind: "documents",
  },
  archive: {
    title: "Archive",
    description: "Archived lesson plans from prior terms.",
    kind: "placeholder",
    placeholderLinks: [{ href: "/teacher/archive", label: "Open archive" }],
  },
  templates: {
    title: "Templates",
    description: "Reusable lesson plan templates.",
    kind: "placeholder",
    placeholderLinks: [{ href: "/teacher/templates", label: "Open templates" }],
  },
  "import-export": {
    title: "Import / Export",
    description: "Backup and restore lesson plans as JSON (skips duplicates).",
    kind: "placeholder",
    placeholderLinks: [{ href: "/teacher/import-export", label: "Import / export" }],
  },
  feedback: {
    title: "Feedback",
    description: "Share product feedback with Explore More Academy administration.",
    kind: "placeholder",
    placeholderLinks: [{ href: "/teacher/feedback", label: "Send feedback" }],
  },
  todos: {
    title: "To-Do List",
    description: "Daily tasks with priority and due dates.",
    kind: "todos",
  },
  checkout: {
    title: "End-of-Day Check-Out",
    description: "Close your day with a checklist, wins, and tomorrow’s priorities.",
    kind: "end-of-day",
  },
};

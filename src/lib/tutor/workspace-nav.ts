/** EMA Teacher Workspace navigation (extends instructor/tutor portal). */
export type TutorNavIcon =
  | "home"
  | "users"
  | "calendar"
  | "library"
  | "upload"
  | "check"
  | "chart"
  | "message"
  | "users-round"
  | "bell"
  | "user"
  | "help"
  | "school"
  | "planner"
  | "book"
  | "target"
  | "clipboard"
  | "gradebook"
  | "test"
  | "flag"
  | "shield"
  | "note"
  | "folder"
  | "box"
  | "bus"
  | "substitute"
  | "report"
  | "file"
  | "award"
  | "todo"
  | "moon"
  | "archive"
  | "template"
  | "import"
  | "feedback"
  | "settings";

export interface TutorNavItem {
  href: string;
  label: string;
  icon: TutorNavIcon;
}

export interface TutorNavGroup {
  title: string;
  items: TutorNavItem[];
}

export const TUTOR_WORKSPACE_NAV: TutorNavGroup[] = [
  {
    title: "Home",
    items: [{ href: "/tutor", label: "Dashboard", icon: "home" }],
  },
  {
    title: "Classroom",
    items: [
      { href: "/tutor/classroom", label: "My Classroom", icon: "school" },
      { href: "/tutor/planner", label: "Teacher Planner", icon: "planner" },
      { href: "/tutor/calendar", label: "Calendar & Schedule", icon: "calendar" },
      { href: "/tutor/lesson-plans", label: "Lesson Plans", icon: "book" },
      { href: "/tutor/curriculum", label: "Curriculum & Standards", icon: "target" },
    ],
  },
  {
    title: "Students",
    items: [
      { href: "/tutor/students", label: "Students", icon: "users" },
      { href: "/tutor/attendance", label: "Attendance", icon: "clipboard" },
      { href: "/tutor/gradebook", label: "Gradebook", icon: "gradebook" },
      { href: "/tutor/assignments", label: "Assignments", icon: "check" },
      { href: "/tutor/assessments", label: "Assessments", icon: "test" },
      { href: "/tutor/progress", label: "Student Progress", icon: "chart" },
      { href: "/tutor/goals", label: "Goals", icon: "flag" },
      { href: "/tutor/interventions", label: "Interventions", icon: "shield" },
      { href: "/tutor/behavior", label: "Behavior & Incidents", icon: "note" },
      { href: "/tutor/notes", label: "Teacher Notes", icon: "note" },
      { href: "/tutor/portfolios", label: "Student Portfolios", icon: "folder" },
    ],
  },
  {
    title: "Resources",
    items: [
      { href: "/tutor/resources", label: "Classroom Resources", icon: "library" },
      { href: "/tutor/upload", label: "Upload Resource", icon: "upload" },
      { href: "/tutor/inventory", label: "Classroom Inventory", icon: "box" },
      { href: "/tutor/field-trips", label: "Field Trips & Activities", icon: "bus" },
      { href: "/tutor/substitute", label: "Substitute Center", icon: "substitute" },
    ],
  },
  {
    title: "Records & files",
    items: [
      { href: "/tutor/reports", label: "Reports", icon: "report" },
      { href: "/tutor/documents", label: "Teacher Documents", icon: "file" },
      { href: "/tutor/professional", label: "Professional Records", icon: "award" },
      { href: "/tutor/professional-development", label: "Professional Development", icon: "award" },
      { href: "/tutor/files", label: "File Center", icon: "folder" },
      { href: "/tutor/archive", label: "Archive", icon: "archive" },
      { href: "/tutor/templates", label: "Templates", icon: "template" },
      { href: "/tutor/import-export", label: "Import / Export", icon: "import" },
    ],
  },
  {
    title: "Daily workflow",
    items: [
      { href: "/tutor/todos", label: "To-Do List", icon: "todo" },
      { href: "/tutor/checkout", label: "End-of-Day Check-Out", icon: "moon" },
    ],
  },
  {
    title: "Communication",
    items: [
      { href: "/tutor/messages", label: "Parent Messages", icon: "message" },
      { href: "/tutor/staff-messages", label: "Staff Messages", icon: "users-round" },
      { href: "/tutor/notifications", label: "Notifications", icon: "bell" },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/tutor/feedback", label: "Feedback", icon: "feedback" },
      { href: "/tutor/help", label: "Help & Training", icon: "help" },
      { href: "/tutor/profile", label: "Settings", icon: "settings" },
    ],
  },
];

/** Flat list for backwards compatibility */
export const TUTOR_NAV_ITEMS = TUTOR_WORKSPACE_NAV.flatMap((g) => g.items);

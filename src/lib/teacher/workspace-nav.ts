/** School teacher portal navigation (digital planner — separate from tutor portal). */
export type TeacherNavIcon =
  | "home"
  | "calendar"
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
  | "settings"
  | "message"
  | "help";

export interface TeacherNavItem {
  href: string;
  label: string;
  icon: TeacherNavIcon;
}

export interface TeacherNavGroup {
  title: string;
  items: TeacherNavItem[];
}

export const TEACHER_WORKSPACE_NAV: TeacherNavGroup[] = [
  {
    title: "Home",
    items: [{ href: "/teacher", label: "Dashboard", icon: "home" }],
  },
  {
    title: "Classroom",
    items: [
      { href: "/teacher/classroom", label: "My Classroom", icon: "school" },
      { href: "/teacher/planner", label: "Teacher Planner", icon: "planner" },
      { href: "/teacher/calendar", label: "Calendar", icon: "calendar" },
      { href: "/teacher/lesson-plans", label: "Lesson Plans", icon: "book" },
      { href: "/teacher/curriculum", label: "Curriculum & Standards", icon: "target" },
    ],
  },
  {
    title: "Instruction",
    items: [
      { href: "/teacher/attendance", label: "Attendance", icon: "clipboard" },
      { href: "/teacher/gradebook", label: "Gradebook", icon: "gradebook" },
      { href: "/teacher/assessments", label: "Assessments", icon: "test" },
      { href: "/teacher/goals", label: "Goals", icon: "flag" },
      { href: "/teacher/interventions", label: "Interventions", icon: "shield" },
      { href: "/teacher/behavior", label: "Behavior & Incidents", icon: "note" },
      { href: "/teacher/notes", label: "Teacher Notes", icon: "note" },
      { href: "/teacher/portfolios", label: "Student Portfolios", icon: "folder" },
    ],
  },
  {
    title: "Resources",
    items: [
      { href: "/teacher/inventory", label: "Classroom Inventory", icon: "box" },
      { href: "/teacher/field-trips", label: "Field Trips & Activities", icon: "bus" },
      { href: "/teacher/substitute", label: "Substitute Center", icon: "substitute" },
    ],
  },
  {
    title: "Records & files",
    items: [
      { href: "/teacher/reports", label: "Reports", icon: "report" },
      { href: "/teacher/documents", label: "Teacher Documents", icon: "file" },
      { href: "/teacher/professional", label: "Professional Records", icon: "award" },
      { href: "/teacher/professional-development", label: "Professional Development", icon: "award" },
      { href: "/teacher/files", label: "File Center", icon: "folder" },
      { href: "/teacher/archive", label: "Archive", icon: "archive" },
      { href: "/teacher/templates", label: "Templates", icon: "template" },
      { href: "/teacher/import-export", label: "Import / Export", icon: "import" },
    ],
  },
  {
    title: "Daily workflow",
    items: [
      { href: "/teacher/todos", label: "To-Do List", icon: "todo" },
      { href: "/teacher/checkout", label: "End-of-Day Check-Out", icon: "moon" },
    ],
  },
  {
    title: "School communication",
    items: [
      { href: "/teacher/messages", label: "Colleague Messages", icon: "message" },
      { href: "/teacher/feedback", label: "Feedback", icon: "feedback" },
      { href: "/teacher/help", label: "Help & Training", icon: "help" },
      { href: "/teacher/profile", label: "Settings", icon: "settings" },
    ],
  },
];

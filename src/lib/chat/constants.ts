export const LEARNING_ASSISTANT_WELCOME =
  "Hi! I'm your Learning Assistant for Explore More Academy. Ask about homework, study skills, reading, math, science, or how to explore a topic—you'll get educational help only. What would you like to learn today?";

export type LearningTopicId =
  | "all"
  | "math"
  | "science"
  | "reading"
  | "study"
  | "homework";

export const LEARNING_TOPICS: Array<{
  id: LearningTopicId;
  label: string;
  hint: string;
}> = [
  { id: "all", label: "All topics", hint: "Ask any learning question…" },
  { id: "math", label: "Math", hint: "Ask a math question…" },
  { id: "science", label: "Science", hint: "Ask a science question…" },
  { id: "reading", label: "Reading", hint: "Ask about reading or writing…" },
  { id: "study", label: "Study skills", hint: "Ask for study tips…" },
  { id: "homework", label: "Homework help", hint: "Describe your homework question…" },
];

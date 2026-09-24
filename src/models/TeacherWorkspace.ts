import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ITeacherClassroom extends Document {
  teacherId: mongoose.Types.ObjectId;
  schoolYear: string;
  className?: string;
  grade?: string;
  subjects: string[];
  room?: string;
  rules?: string;
  procedures?: string;
  dailyRoutine?: string;
  classroomGoals?: string;
  supplyList?: string;
  emergencyProcedures?: string;
  importantDates?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherClassroomSchema = new Schema<ITeacherClassroom>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    schoolYear: { type: String, required: true },
    className: String,
    grade: String,
    subjects: [String],
    room: String,
    rules: String,
    procedures: String,
    dailyRoutine: String,
    classroomGoals: String,
    supplyList: String,
    emergencyProcedures: String,
    importantDates: String,
    notes: String,
  },
  { timestamps: true }
);
TeacherClassroomSchema.index({ teacherId: 1, schoolYear: 1 }, { unique: true });

export interface ITeacherLessonPlan extends Document {
  teacherId: mongoose.Types.ObjectId;
  schoolYear: string;
  title: string;
  date?: Date;
  grade?: string;
  subject?: string;
  unit?: string;
  duration?: string;
  status: "draft" | "ready" | "taught" | "reteach" | "completed";
  learningObjective?: string;
  essentialQuestion?: string;
  materials?: string;
  warmUp?: string;
  instruction?: string;
  assessment?: string;
  homework?: string;
  differentiation?: string;
  reflection?: string;
  notes?: string;
  attachmentPaths: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TeacherLessonPlanSchema = new Schema<ITeacherLessonPlan>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    schoolYear: { type: String, required: true },
    title: { type: String, required: true },
    date: Date,
    grade: String,
    subject: String,
    unit: String,
    duration: String,
    status: {
      type: String,
      enum: ["draft", "ready", "taught", "reteach", "completed"],
      default: "draft",
    },
    learningObjective: String,
    essentialQuestion: String,
    materials: String,
    warmUp: String,
    instruction: String,
    assessment: String,
    homework: String,
    differentiation: String,
    reflection: String,
    notes: String,
    attachmentPaths: [String],
  },
  { timestamps: true }
);
TeacherLessonPlanSchema.index({ teacherId: 1, schoolYear: 1, date: -1 });

export interface ITeacherPlannerEntry extends Document {
  teacherId: mongoose.Types.ObjectId;
  schoolYear: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  title: string;
  subject?: string;
  entryType: "lesson" | "assignment" | "assessment" | "meeting" | "event" | "other";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherPlannerEntrySchema = new Schema<ITeacherPlannerEntry>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    schoolYear: { type: String, required: true },
    date: { type: Date, required: true },
    startTime: String,
    endTime: String,
    title: { type: String, required: true },
    subject: String,
    entryType: {
      type: String,
      enum: ["lesson", "assignment", "assessment", "meeting", "event", "other"],
      default: "lesson",
    },
    notes: String,
  },
  { timestamps: true }
);
TeacherPlannerEntrySchema.index({ teacherId: 1, date: 1 });

export interface ITeacherClassAttendance extends Document {
  teacherId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  date: Date;
  status: "present" | "absent" | "tardy" | "excused" | "remote";
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherClassAttendanceSchema = new Schema<ITeacherClassAttendance>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["present", "absent", "tardy", "excused", "remote"],
      default: "present",
    },
    note: String,
  },
  { timestamps: true }
);
TeacherClassAttendanceSchema.index({ teacherId: 1, studentId: 1, date: 1 }, { unique: true });

export interface ITeacherGradeAssignment extends Document {
  teacherId: mongoose.Types.ObjectId;
  schoolYear: string;
  title: string;
  category: string;
  pointsPossible: number;
  assignedDate?: Date;
  dueDate?: Date;
  instructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherGradeAssignmentSchema = new Schema<ITeacherGradeAssignment>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    schoolYear: { type: String, required: true },
    title: { type: String, required: true },
    category: { type: String, default: "Classwork" },
    pointsPossible: { type: Number, default: 100 },
    assignedDate: Date,
    dueDate: Date,
    instructions: String,
  },
  { timestamps: true }
);

export interface ITeacherGradeScore extends Document {
  assignmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  score?: number;
  status: "graded" | "missing" | "late" | "excused" | "incomplete";
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherGradeScoreSchema = new Schema<ITeacherGradeScore>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: "TeacherGradeAssignment", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    score: Number,
    status: {
      type: String,
      enum: ["graded", "missing", "late", "excused", "incomplete"],
      default: "missing",
    },
    note: String,
  },
  { timestamps: true }
);
TeacherGradeScoreSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export type WorkspaceRecordType = "note" | "behavior" | "intervention" | "goal";

export interface ITeacherWorkspaceRecord extends Document {
  teacherId: mongoose.Types.ObjectId;
  schoolYear: string;
  recordType: WorkspaceRecordType;
  studentId?: mongoose.Types.ObjectId;
  category?: string;
  title?: string;
  body: string;
  eventDate: Date;
  followUpDate?: Date;
  meta?: Record<string, unknown>;
  attachmentPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherWorkspaceRecordSchema = new Schema<ITeacherWorkspaceRecord>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    schoolYear: { type: String, required: true },
    recordType: {
      type: String,
      enum: ["note", "behavior", "intervention", "goal"],
      required: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: "User" },
    category: String,
    title: String,
    body: { type: String, required: true },
    eventDate: { type: Date, default: Date.now },
    followUpDate: Date,
    meta: Schema.Types.Mixed,
    attachmentPath: String,
  },
  { timestamps: true }
);
TeacherWorkspaceRecordSchema.index({ teacherId: 1, recordType: 1, eventDate: -1 });

export interface ITeacherTodo extends Document {
  teacherId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: "urgent" | "important" | "normal";
  status: "open" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

const TeacherTodoSchema = new Schema<ITeacherTodo>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: String,
    dueDate: Date,
    priority: { type: String, enum: ["urgent", "important", "normal"], default: "normal" },
    status: { type: String, enum: ["open", "completed"], default: "open" },
  },
  { timestamps: true }
);

export interface ITeacherInventoryItem extends Document {
  teacherId: mongoose.Types.ObjectId;
  itemName: string;
  category?: string;
  quantity: number;
  condition?: string;
  location?: string;
  assetNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherInventoryItemSchema = new Schema<ITeacherInventoryItem>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    itemName: { type: String, required: true },
    category: String,
    quantity: { type: Number, default: 1 },
    condition: String,
    location: String,
    assetNumber: String,
    notes: String,
  },
  { timestamps: true }
);

export interface ITeacherFieldTrip extends Document {
  teacherId: mongoose.Types.ObjectId;
  schoolYear: string;
  tripName: string;
  destination?: string;
  tripDate?: Date;
  objective?: string;
  schedule?: string;
  notes?: string;
  checklist?: string;
  reflection?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherFieldTripSchema = new Schema<ITeacherFieldTrip>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    schoolYear: { type: String, required: true },
    tripName: { type: String, required: true },
    destination: String,
    tripDate: Date,
    objective: String,
    schedule: String,
    notes: String,
    checklist: String,
    reflection: String,
  },
  { timestamps: true }
);

export interface ITeacherStandardCoverage extends Document {
  teacherId: mongoose.Types.ObjectId;
  schoolYear: string;
  subject: string;
  standardCode: string;
  standardLabel: string;
  status: "not_started" | "planned" | "teaching" | "taught" | "assessed" | "mastered";
  createdAt: Date;
  updatedAt: Date;
}

const TeacherStandardCoverageSchema = new Schema<ITeacherStandardCoverage>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    schoolYear: { type: String, required: true },
    subject: { type: String, required: true },
    standardCode: { type: String, required: true },
    standardLabel: { type: String, required: true },
    status: {
      type: String,
      enum: ["not_started", "planned", "teaching", "taught", "assessed", "mastered"],
      default: "not_started",
    },
  },
  { timestamps: true }
);
TeacherStandardCoverageSchema.index(
  { teacherId: 1, schoolYear: 1, standardCode: 1 },
  { unique: true }
);

export interface ITeacherEndOfDayLog extends Document {
  teacherId: mongoose.Types.ObjectId;
  logDate: Date;
  checklist: Record<string, boolean>;
  todaysWin?: string;
  reteach?: string;
  studentsNeedingAttention?: string;
  tomorrowPriority?: string;
  reflection?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherEndOfDayLogSchema = new Schema<ITeacherEndOfDayLog>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    logDate: { type: Date, required: true },
    checklist: { type: Schema.Types.Mixed, default: {} },
    todaysWin: String,
    reteach: String,
    studentsNeedingAttention: String,
    tomorrowPriority: String,
    reflection: String,
  },
  { timestamps: true }
);
TeacherEndOfDayLogSchema.index({ teacherId: 1, logDate: 1 }, { unique: true });

export interface ITeacherDocumentFile extends Document {
  teacherId: mongoose.Types.ObjectId;
  schoolYear: string;
  folder: string;
  fileName: string;
  filePath: string;
  description?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TeacherDocumentFileSchema = new Schema<ITeacherDocumentFile>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    schoolYear: { type: String, required: true },
    folder: { type: String, default: "Other" },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    description: String,
    tags: [String],
  },
  { timestamps: true }
);

export const TeacherClassroom: Model<ITeacherClassroom> =
  mongoose.models.TeacherClassroom ??
  mongoose.model<ITeacherClassroom>("TeacherClassroom", TeacherClassroomSchema);

export const TeacherLessonPlan: Model<ITeacherLessonPlan> =
  mongoose.models.TeacherLessonPlan ??
  mongoose.model<ITeacherLessonPlan>("TeacherLessonPlan", TeacherLessonPlanSchema);

export const TeacherPlannerEntry: Model<ITeacherPlannerEntry> =
  mongoose.models.TeacherPlannerEntry ??
  mongoose.model<ITeacherPlannerEntry>("TeacherPlannerEntry", TeacherPlannerEntrySchema);

export const TeacherClassAttendance: Model<ITeacherClassAttendance> =
  mongoose.models.TeacherClassAttendance ??
  mongoose.model<ITeacherClassAttendance>("TeacherClassAttendance", TeacherClassAttendanceSchema);

export const TeacherGradeAssignment: Model<ITeacherGradeAssignment> =
  mongoose.models.TeacherGradeAssignment ??
  mongoose.model<ITeacherGradeAssignment>("TeacherGradeAssignment", TeacherGradeAssignmentSchema);

export const TeacherGradeScore: Model<ITeacherGradeScore> =
  mongoose.models.TeacherGradeScore ??
  mongoose.model<ITeacherGradeScore>("TeacherGradeScore", TeacherGradeScoreSchema);

export const TeacherWorkspaceRecord: Model<ITeacherWorkspaceRecord> =
  mongoose.models.TeacherWorkspaceRecord ??
  mongoose.model<ITeacherWorkspaceRecord>("TeacherWorkspaceRecord", TeacherWorkspaceRecordSchema);

export const TeacherTodo: Model<ITeacherTodo> =
  mongoose.models.TeacherTodo ??
  mongoose.model<ITeacherTodo>("TeacherTodo", TeacherTodoSchema);

export const TeacherInventoryItem: Model<ITeacherInventoryItem> =
  mongoose.models.TeacherInventoryItem ??
  mongoose.model<ITeacherInventoryItem>("TeacherInventoryItem", TeacherInventoryItemSchema);

export const TeacherFieldTrip: Model<ITeacherFieldTrip> =
  mongoose.models.TeacherFieldTrip ??
  mongoose.model<ITeacherFieldTrip>("TeacherFieldTrip", TeacherFieldTripSchema);

export const TeacherStandardCoverage: Model<ITeacherStandardCoverage> =
  mongoose.models.TeacherStandardCoverage ??
  mongoose.model<ITeacherStandardCoverage>("TeacherStandardCoverage", TeacherStandardCoverageSchema);

export const TeacherEndOfDayLog: Model<ITeacherEndOfDayLog> =
  mongoose.models.TeacherEndOfDayLog ??
  mongoose.model<ITeacherEndOfDayLog>("TeacherEndOfDayLog", TeacherEndOfDayLogSchema);

export const TeacherDocumentFile: Model<ITeacherDocumentFile> =
  mongoose.models.TeacherDocumentFile ??
  mongoose.model<ITeacherDocumentFile>("TeacherDocumentFile", TeacherDocumentFileSchema);

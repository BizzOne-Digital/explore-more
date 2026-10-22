import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireTeacherPortal } from "@/lib/teacher/api-auth";
import { currentSchoolYear } from "@/lib/tutor/school-year";
import { pickLessonPlanFields } from "@/lib/teacher/lesson-plan-fields";
import {
  TeacherClassAttendance,
  TeacherClassroom,
  TeacherDocumentFile,
  TeacherEndOfDayLog,
  TeacherFieldTrip,
  TeacherGradeAssignment,
  TeacherGradeScore,
  TeacherAssessment,
  TeacherInventoryItem,
  TeacherLessonPlan,
  TeacherLessonPlanRevision,
  TeacherPlannerEntry,
  TeacherStandardCoverage,
  TeacherTodo,
  TeacherWorkspaceRecord,
  type WorkspaceRecordType,
} from "@/models";

const RECORD_TYPES = new Set<WorkspaceRecordType>(["note", "behavior", "intervention", "goal"]);

type WorkspaceModule =
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
  | "documents";

function parseModule(raw: string): WorkspaceModule | null {
  const allowed: WorkspaceModule[] = [
    "classroom",
    "lesson-plans",
    "planner",
    "attendance",
    "gradebook",
    "assessments",
    "records",
    "todos",
    "inventory",
    "field-trips",
    "standards",
    "end-of-day",
    "documents",
  ];
  return allowed.includes(raw as WorkspaceModule) ? (raw as WorkspaceModule) : null;
}

function parseId(id: string | null | undefined) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
  return id;
}

function dayRange(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ module: string }> }
) {
  const sessionResult = await requireTeacherPortal();
  if ("error" in sessionResult) return sessionResult.error;

  const { module: rawModule } = await context.params;
  const workspaceModule = parseModule(rawModule);
  if (!workspaceModule) return jsonError("Unknown workspace module", 404);

  await connectDB();
  const teacherId = sessionResult.user.id;
  const schoolYear = request.nextUrl.searchParams.get("schoolYear") ?? currentSchoolYear();

  switch (workspaceModule) {
    case "classroom": {
      const doc = await TeacherClassroom.findOne({ teacherId, schoolYear }).lean();
      return jsonOk({ item: doc });
    }
    case "lesson-plans": {
      const singleId = request.nextUrl.searchParams.get("id");
      if (singleId && mongoose.Types.ObjectId.isValid(singleId)) {
        const item = await TeacherLessonPlan.findOne({ _id: singleId, teacherId }).lean();
        if (!item) return jsonError("Not found", 404);
        return jsonOk({ item });
      }
      const view = request.nextUrl.searchParams.get("view");
      const filter: Record<string, unknown> = { teacherId, schoolYear };
      if (view === "templates") {
        filter.isTemplate = true;
        filter.archived = { $ne: true };
      } else if (view === "archive") {
        filter.archived = true;
      } else {
        filter.archived = { $ne: true };
        filter.isTemplate = { $ne: true };
      }
      const items = await TeacherLessonPlan.find(filter)
        .sort({ date: -1, updatedAt: -1 })
        .limit(300)
        .lean();
      return jsonOk({ items });
    }
    case "planner": {
      const from = request.nextUrl.searchParams.get("from");
      const to = request.nextUrl.searchParams.get("to");
      const studentId = request.nextUrl.searchParams.get("studentId");
      const scope = request.nextUrl.searchParams.get("scope");
      const filter: Record<string, unknown> = { teacherId, schoolYear };
      if (from || to) {
        filter.date = {};
        if (from) (filter.date as Record<string, Date>).$gte = new Date(from);
        if (to) (filter.date as Record<string, Date>).$lte = new Date(to);
      }
      if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
        filter.studentId = studentId;
      } else if (scope === "teacher") {
        filter.$or = [{ studentId: { $exists: false } }, { studentId: null }];
      } else if (scope === "students") {
        filter.studentId = { $exists: true, $ne: null };
      }
      const items = await TeacherPlannerEntry.find(filter).sort({ date: 1, startTime: 1 }).lean();
      return jsonOk({ items });
    }
    case "attendance": {
      const range = dayRange(request.nextUrl.searchParams.get("date"));
      const filter: Record<string, unknown> = { teacherId };
      if (range) filter.date = { $gte: range.start, $lt: range.end };
      const items = await TeacherClassAttendance.find(filter).sort({ date: -1 }).limit(500).lean();
      return jsonOk({ items });
    }
    case "gradebook": {
      const assignments = await TeacherGradeAssignment.find({ teacherId, schoolYear })
        .sort({ dueDate: -1, createdAt: -1 })
        .lean();
      const assignmentIds = assignments.map((a) => a._id);
      const scores = assignmentIds.length
        ? await TeacherGradeScore.find({ teacherId, assignmentId: { $in: assignmentIds } }).lean()
        : [];
      return jsonOk({ assignments, scores });
    }
    case "assessments": {
      const studentId = request.nextUrl.searchParams.get("studentId");
      const filter: Record<string, unknown> = { teacherId, schoolYear };
      if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
        filter.studentId = studentId;
      }
      const items = await TeacherAssessment.find(filter)
        .sort({ eventDate: -1 })
        .limit(300)
        .lean();
      return jsonOk({ items });
    }
    case "records": {
      const recordType = request.nextUrl.searchParams.get("recordType") as WorkspaceRecordType | null;
      const studentId = request.nextUrl.searchParams.get("studentId");
      const filter: Record<string, unknown> = { teacherId, schoolYear };
      if (recordType && RECORD_TYPES.has(recordType)) filter.recordType = recordType;
      if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
        filter.studentId = studentId;
      }
      const items = await TeacherWorkspaceRecord.find(filter).sort({ eventDate: -1 }).limit(300).lean();
      return jsonOk({ items });
    }
    case "todos": {
      const status = request.nextUrl.searchParams.get("status");
      const filter: Record<string, unknown> = { teacherId };
      if (status === "open" || status === "completed") filter.status = status;
      const items = await TeacherTodo.find(filter).sort({ dueDate: 1, createdAt: -1 }).lean();
      return jsonOk({ items });
    }
    case "inventory": {
      const items = await TeacherInventoryItem.find({ teacherId }).sort({ itemName: 1 }).lean();
      return jsonOk({ items });
    }
    case "field-trips": {
      const items = await TeacherFieldTrip.find({ teacherId, schoolYear })
        .sort({ tripDate: -1 })
        .lean();
      return jsonOk({ items });
    }
    case "standards": {
      const items = await TeacherStandardCoverage.find({ teacherId, schoolYear })
        .sort({ subject: 1, standardCode: 1 })
        .lean();
      return jsonOk({ items });
    }
    case "end-of-day": {
      const range = dayRange(request.nextUrl.searchParams.get("date") ?? new Date().toISOString());
      const filter: Record<string, unknown> = { teacherId };
      if (range) filter.logDate = { $gte: range.start, $lt: range.end };
      const item = range
        ? await TeacherEndOfDayLog.findOne(filter).lean()
        : await TeacherEndOfDayLog.findOne({ teacherId }).sort({ logDate: -1 }).lean();
      return jsonOk({ item });
    }
    case "documents": {
      const folder = request.nextUrl.searchParams.get("folder");
      const filter: Record<string, unknown> = { teacherId, schoolYear };
      if (folder) filter.folder = folder;
      const items = await TeacherDocumentFile.find(filter).sort({ updatedAt: -1 }).limit(300).lean();
      return jsonOk({ items });
    }
    default:
      return jsonError("Unknown workspace module", 404);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ module: string }> }
) {
  const sessionResult = await requireTeacherPortal();
  if ("error" in sessionResult) return sessionResult.error;

  const { module: rawModule } = await context.params;
  const workspaceModule = parseModule(rawModule);
  if (!workspaceModule) return jsonError("Unknown workspace module", 404);

  await connectDB();
  const teacherId = sessionResult.user.id;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return jsonError("Invalid body", 400);

  const schoolYear =
    typeof body.schoolYear === "string" ? body.schoolYear : currentSchoolYear();

  switch (workspaceModule) {
    case "classroom": {
      const doc = await TeacherClassroom.findOneAndUpdate(
        { teacherId, schoolYear },
        { $set: { ...body, teacherId, schoolYear } },
        { upsert: true, new: true }
      );
      return jsonOk({ item: doc });
    }
    case "lesson-plans": {
      const fields = pickLessonPlanFields(body as Record<string, unknown>);
      const doc = await TeacherLessonPlan.create({
        teacherId,
        schoolYear,
        title: body.title ?? "Untitled lesson",
        ...fields,
      });
      return jsonOk({ item: doc });
    }
    case "planner": {
      const studentId = parseId(body.studentId);
      const doc = await TeacherPlannerEntry.create({
        teacherId,
        schoolYear,
        ...(studentId ? { studentId } : {}),
        date: body.date ? new Date(body.date) : new Date(),
        title: body.title ?? "Planner entry",
        subject: body.subject,
        startTime: body.startTime,
        endTime: body.endTime,
        entryType: body.entryType ?? "lesson",
        notes: body.notes,
      });
      return jsonOk({ item: doc });
    }
    case "attendance": {
      const studentId = parseId(body.studentId);
      if (!studentId) return jsonError("studentId required", 400);
      const date = body.date ? new Date(body.date) : new Date();
      const doc = await TeacherClassAttendance.findOneAndUpdate(
        { teacherId, studentId, date: dayRange(date.toISOString())?.start ?? date },
        {
          $set: {
            teacherId,
            studentId,
            date: dayRange(date.toISOString())?.start ?? date,
            status: body.status ?? "present",
            note: body.note,
          },
        },
        { upsert: true, new: true }
      );
      return jsonOk({ item: doc });
    }
    case "gradebook": {
      if (body.kind === "score") {
        const assignmentId = parseId(body.assignmentId);
        const studentId = parseId(body.studentId);
        if (!assignmentId || !studentId) return jsonError("assignmentId and studentId required", 400);
        const doc = await TeacherGradeScore.findOneAndUpdate(
          { assignmentId, studentId },
          {
            $set: {
              assignmentId,
              studentId,
              teacherId,
              score: body.score,
              status: body.status ?? "graded",
              note: body.note,
            },
          },
          { upsert: true, new: true }
        );
        return jsonOk({ item: doc });
      }
      const pointsPossible = Math.max(0, Number(body.pointsPossible) || 100);
      const doc = await TeacherGradeAssignment.create({
        teacherId,
        schoolYear,
        title: body.title ?? "Assignment",
        category: body.category ?? "Classwork",
        pointsPossible,
        assignedDate: body.assignedDate,
        dueDate: body.dueDate,
        instructions: body.instructions,
      });
      return jsonOk({ item: doc });
    }
    case "assessments": {
      const studentId = parseId(body.studentId);
      if (!studentId) return jsonError("studentId required", 400);
      const doc = await TeacherAssessment.create({
        teacherId,
        schoolYear,
        studentId,
        subject: body.subject,
        title: body.title ?? "Assessment",
        assessmentType: body.assessmentType,
        gradeLevel: body.gradeLevel,
        eventDate: body.eventDate ? new Date(body.eventDate) : new Date(),
        score: body.score != null ? Number(body.score) : undefined,
        maxScore: body.maxScore != null ? Number(body.maxScore) : 100,
        notes: body.notes,
      });
      return jsonOk({ item: doc });
    }
    case "records": {
      const recordType = body.recordType as WorkspaceRecordType;
      if (!RECORD_TYPES.has(recordType)) return jsonError("recordType required", 400);
      const doc = await TeacherWorkspaceRecord.create({
        teacherId,
        schoolYear,
        recordType,
        studentId: parseId(body.studentId) ?? undefined,
        category: body.category,
        title: body.title,
        body: body.body ?? "",
        eventDate: body.eventDate ? new Date(body.eventDate) : new Date(),
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : undefined,
        meta: body.meta,
        attachmentPath: body.attachmentPath,
      });
      return jsonOk({ item: doc });
    }
    case "todos": {
      const doc = await TeacherTodo.create({
        teacherId,
        title: body.title ?? "Task",
        description: body.description,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        dueTime: body.dueTime,
        priority: body.priority ?? "normal",
        status: "open",
      });
      return jsonOk({ item: doc });
    }
    case "inventory": {
      const doc = await TeacherInventoryItem.create({
        teacherId,
        itemName: body.itemName ?? "Item",
        category: body.category,
        quantity: Math.max(0, Number(body.quantity) || 1),
        condition: body.condition,
        location: body.location,
        assetNumber: body.assetNumber,
        notes: body.notes,
      });
      return jsonOk({ item: doc });
    }
    case "field-trips": {
      const rosterStudentIds = Array.isArray(body.rosterStudentIds)
        ? body.rosterStudentIds
            .map((id: unknown) => parseId(String(id)))
            .filter(Boolean)
        : [];
      const doc = await TeacherFieldTrip.create({
        teacherId,
        schoolYear,
        tripName: body.tripName ?? "Field trip",
        destination: body.destination,
        tripTime: body.tripTime,
        tripDate: body.tripDate ? new Date(body.tripDate) : undefined,
        rosterStudentIds,
        objective: body.objective,
        schedule: body.schedule,
        notes: body.notes,
        checklist: body.checklist,
        reflection: body.reflection,
      });
      return jsonOk({ item: doc });
    }
    case "standards": {
      const doc = await TeacherStandardCoverage.findOneAndUpdate(
        {
          teacherId,
          schoolYear,
          standardCode: body.standardCode,
        },
        {
          $set: {
            teacherId,
            schoolYear,
            subject: body.subject ?? "General",
            standardCode: body.standardCode,
            standardLabel: body.standardLabel ?? body.standardCode,
            status: body.status ?? "not_started",
          },
        },
        { upsert: true, new: true }
      );
      return jsonOk({ item: doc });
    }
    case "end-of-day": {
      const logDate = body.logDate ? new Date(body.logDate) : new Date();
      const start = dayRange(logDate.toISOString())?.start ?? logDate;
      const doc = await TeacherEndOfDayLog.findOneAndUpdate(
        { teacherId, logDate: start },
        {
          $set: {
            teacherId,
            logDate: start,
            checklist: body.checklist ?? {},
            todaysWin: body.todaysWin,
            reteach: body.reteach,
            studentsNeedingAttention: body.studentsNeedingAttention,
            tomorrowPriority: body.tomorrowPriority,
            reflection: body.reflection,
          },
        },
        { upsert: true, new: true }
      );
      return jsonOk({ item: doc });
    }
    case "documents": {
      const doc = await TeacherDocumentFile.create({
        teacherId,
        schoolYear,
        folder: body.folder ?? "Other",
        fileName: body.fileName ?? "Document",
        filePath: body.filePath ?? "",
        description: body.description,
        tags: Array.isArray(body.tags) ? body.tags : [],
      });
      return jsonOk({ item: doc });
    }
    default:
      return jsonError("Unknown workspace module", 404);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ module: string }> }
) {
  const sessionResult = await requireTeacherPortal();
  if ("error" in sessionResult) return sessionResult.error;

  const { module: rawModule } = await context.params;
  const workspaceModule = parseModule(rawModule);
  if (!workspaceModule) return jsonError("Unknown workspace module", 404);

  const body = await request.json().catch(() => null);
  if (!body?.id) return jsonError("id required", 400);
  const id = parseId(body.id);
  if (!id) return jsonError("Invalid id", 400);

  await connectDB();
  const teacherId = sessionResult.user.id;

  type TeacherOwnedModel = {
    findOneAndUpdate: (
      filter: Record<string, unknown>,
      update: Record<string, unknown>,
      options: Record<string, unknown>
    ) => Promise<unknown>;
  };

  const updateOwned = async (Model: TeacherOwnedModel, extra: Record<string, unknown> = {}) => {
    const fields = { ...(body.data ?? body) } as Record<string, unknown>;
    delete fields.id;
    delete fields.kind;
    delete fields.data;

    if (workspaceModule === "inventory" && fields.quantity != null) {
      fields.quantity = Math.max(0, Number(fields.quantity) || 0);
    }
    if (workspaceModule === "field-trips") {
      if (fields.tripDate === "") {
        fields.tripDate = undefined;
      } else if (fields.tripDate) {
        const parsed = new Date(String(fields.tripDate));
        if (!Number.isNaN(parsed.getTime())) fields.tripDate = parsed;
        else delete fields.tripDate;
      }
      if (fields.rosterStudentIds != null) {
        const ids = Array.isArray(fields.rosterStudentIds)
          ? fields.rosterStudentIds
          : [fields.rosterStudentIds];
        fields.rosterStudentIds = ids
          .map((id) => parseId(String(id)))
          .filter(Boolean);
      }
    }
    if (workspaceModule === "planner") {
      if (fields.date) {
        const parsed = new Date(String(fields.date));
        if (!Number.isNaN(parsed.getTime())) fields.date = parsed;
        else delete fields.date;
      }
      if (fields.studentId === "" || fields.studentId === null) {
        fields.studentId = undefined;
      } else if (fields.studentId) {
        const sid = parseId(String(fields.studentId));
        if (sid) fields.studentId = sid;
        else delete fields.studentId;
      }
    }
    if (workspaceModule === "gradebook" && fields.pointsPossible != null) {
      fields.pointsPossible = Math.max(0, Number(fields.pointsPossible) || 0);
    }
    if (workspaceModule === "lesson-plans") {
      const picked = pickLessonPlanFields({ ...fields });
      for (const k of Object.keys(fields)) {
        if (k !== "id") delete fields[k];
      }
      Object.assign(fields, picked);
      delete fields.revisionNote;
    }
    if (workspaceModule === "assessments") {
      if (fields.score != null) fields.score = Number(fields.score);
      if (fields.maxScore != null) fields.maxScore = Number(fields.maxScore);
      if (fields.eventDate) {
        const parsed = new Date(String(fields.eventDate));
        if (!Number.isNaN(parsed.getTime())) fields.eventDate = parsed;
        else delete fields.eventDate;
      }
    }

    const doc = await Model.findOneAndUpdate(
      { _id: id, teacherId, ...extra },
      { $set: fields },
      { new: true, runValidators: true }
    );
    if (!doc) return jsonError("Not found", 404);
    return jsonOk({ item: doc });
  };

  switch (workspaceModule) {
    case "lesson-plans": {
      const existing = await TeacherLessonPlan.findOne({ _id: id, teacherId }).lean();
      if (!existing) return jsonError("Not found", 404);
      const fields = pickLessonPlanFields(body as Record<string, unknown>);
      await TeacherLessonPlanRevision.create({
        lessonPlanId: id,
        teacherId,
        snapshot: { ...existing, _id: undefined },
        note: typeof body.revisionNote === "string" ? body.revisionNote : undefined,
      });
      const revisions = await TeacherLessonPlanRevision.find({ lessonPlanId: id })
        .sort({ createdAt: -1 })
        .select("_id")
        .lean();
      if (revisions.length > 25) {
        const toDrop = revisions.slice(25).map((r) => r._id);
        await TeacherLessonPlanRevision.deleteMany({ _id: { $in: toDrop } });
      }
      return updateOwned(TeacherLessonPlan);
    }
    case "planner":
      return updateOwned(TeacherPlannerEntry);
    case "attendance":
      return updateOwned(TeacherClassAttendance);
    case "gradebook":
      if (body.kind === "assignment") return updateOwned(TeacherGradeAssignment);
      return updateOwned(TeacherGradeScore);
    case "assessments":
      return updateOwned(TeacherAssessment);
    case "records":
      return updateOwned(TeacherWorkspaceRecord);
    case "todos":
      return updateOwned(TeacherTodo);
    case "inventory":
      return updateOwned(TeacherInventoryItem);
    case "field-trips":
      return updateOwned(TeacherFieldTrip);
    case "standards":
      return updateOwned(TeacherStandardCoverage);
    case "documents":
      return updateOwned(TeacherDocumentFile);
    default:
      return jsonError("PATCH not supported for this module", 400);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ module: string }> }
) {
  const sessionResult = await requireTeacherPortal();
  if ("error" in sessionResult) return sessionResult.error;

  const { module: rawModule } = await context.params;
  const workspaceModule = parseModule(rawModule);
  if (!workspaceModule) return jsonError("Unknown workspace module", 404);

  const id = parseId(request.nextUrl.searchParams.get("id"));
  if (!id) return jsonError("id required", 400);

  await connectDB();
  const teacherId = sessionResult.user.id;

  type DeletableModel = {
    findOneAndDelete: (filter: Record<string, unknown>) => Promise<unknown>;
    deleteMany?: (filter: Record<string, unknown>) => Promise<unknown>;
  };

  const models: Partial<Record<WorkspaceModule, DeletableModel>> = {
    "lesson-plans": TeacherLessonPlan,
    planner: TeacherPlannerEntry,
    attendance: TeacherClassAttendance,
    records: TeacherWorkspaceRecord,
    todos: TeacherTodo,
    inventory: TeacherInventoryItem,
    assessments: TeacherAssessment,
    "field-trips": TeacherFieldTrip,
    standards: TeacherStandardCoverage,
    documents: TeacherDocumentFile,
  };

  if (workspaceModule === "gradebook") {
    const kind = request.nextUrl.searchParams.get("kind");
    const Model = (kind === "assignment" ? TeacherGradeAssignment : TeacherGradeScore) as DeletableModel;
    const deleted = await Model.findOneAndDelete({ _id: id, teacherId });
    if (!deleted) return jsonError("Not found", 404);
    if (kind === "assignment") {
      await (TeacherGradeScore as DeletableModel).deleteMany?.({ assignmentId: id, teacherId });
    }
    return jsonOk({ ok: true });
  }

  const Model = models[workspaceModule];
  if (!Model) return jsonError("DELETE not supported", 400);

  const deleted = await Model.findOneAndDelete({ _id: id, teacherId });
  if (!deleted) return jsonError("Not found", 404);
  return jsonOk({ ok: true });
}

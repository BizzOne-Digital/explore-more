import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireTutorPortal } from "@/lib/tutor/api-auth";
import { currentSchoolYear } from "@/lib/tutor/school-year";
import {
  TeacherClassAttendance,
  TeacherClassroom,
  TeacherDocumentFile,
  TeacherEndOfDayLog,
  TeacherFieldTrip,
  TeacherGradeAssignment,
  TeacherGradeScore,
  TeacherInventoryItem,
  TeacherLessonPlan,
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
  const sessionResult = await requireTutorPortal();
  if ("error" in sessionResult) return sessionResult.error;

  const { module: rawModule } = await context.params;
  const module = parseModule(rawModule);
  if (!module) return jsonError("Unknown workspace module", 404);

  await connectDB();
  const teacherId = sessionResult.user.id;
  const schoolYear = request.nextUrl.searchParams.get("schoolYear") ?? currentSchoolYear();

  switch (module) {
    case "classroom": {
      const doc = await TeacherClassroom.findOne({ teacherId, schoolYear }).lean();
      return jsonOk({ item: doc });
    }
    case "lesson-plans": {
      const items = await TeacherLessonPlan.find({ teacherId, schoolYear })
        .sort({ date: -1, updatedAt: -1 })
        .limit(200)
        .lean();
      return jsonOk({ items });
    }
    case "planner": {
      const from = request.nextUrl.searchParams.get("from");
      const to = request.nextUrl.searchParams.get("to");
      const filter: Record<string, unknown> = { teacherId, schoolYear };
      if (from || to) {
        filter.date = {};
        if (from) (filter.date as Record<string, Date>).$gte = new Date(from);
        if (to) (filter.date as Record<string, Date>).$lte = new Date(to);
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
    case "records": {
      const recordType = request.nextUrl.searchParams.get("recordType") as WorkspaceRecordType | null;
      const filter: Record<string, unknown> = { teacherId, schoolYear };
      if (recordType && RECORD_TYPES.has(recordType)) filter.recordType = recordType;
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
  const sessionResult = await requireTutorPortal();
  if ("error" in sessionResult) return sessionResult.error;

  const { module: rawModule } = await context.params;
  const module = parseModule(rawModule);
  if (!module) return jsonError("Unknown workspace module", 404);

  await connectDB();
  const teacherId = sessionResult.user.id;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return jsonError("Invalid body", 400);

  const schoolYear =
    typeof body.schoolYear === "string" ? body.schoolYear : currentSchoolYear();

  switch (module) {
    case "classroom": {
      const doc = await TeacherClassroom.findOneAndUpdate(
        { teacherId, schoolYear },
        { $set: { ...body, teacherId, schoolYear } },
        { upsert: true, new: true }
      );
      return jsonOk({ item: doc });
    }
    case "lesson-plans": {
      const doc = await TeacherLessonPlan.create({
        teacherId,
        schoolYear,
        title: body.title ?? "Untitled lesson",
        ...body,
      });
      return jsonOk({ item: doc });
    }
    case "planner": {
      const doc = await TeacherPlannerEntry.create({
        teacherId,
        schoolYear,
        date: body.date ? new Date(body.date) : new Date(),
        title: body.title ?? "Planner entry",
        ...body,
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
      const doc = await TeacherGradeAssignment.create({
        teacherId,
        schoolYear,
        title: body.title ?? "Assignment",
        category: body.category ?? "Classwork",
        pointsPossible: body.pointsPossible ?? 100,
        assignedDate: body.assignedDate,
        dueDate: body.dueDate,
        instructions: body.instructions,
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
        quantity: body.quantity ?? 1,
        condition: body.condition,
        location: body.location,
        assetNumber: body.assetNumber,
        notes: body.notes,
      });
      return jsonOk({ item: doc });
    }
    case "field-trips": {
      const doc = await TeacherFieldTrip.create({
        teacherId,
        schoolYear,
        tripName: body.tripName ?? "Field trip",
        destination: body.destination,
        tripDate: body.tripDate ? new Date(body.tripDate) : undefined,
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
  const sessionResult = await requireTutorPortal();
  if ("error" in sessionResult) return sessionResult.error;

  const { module: rawModule } = await context.params;
  const module = parseModule(rawModule);
  if (!module) return jsonError("Unknown workspace module", 404);

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
    const doc = await Model.findOneAndUpdate(
      { _id: id, teacherId, ...extra },
      { $set: body.data ?? body },
      { new: true }
    );
    if (!doc) return jsonError("Not found", 404);
    return jsonOk({ item: doc });
  };

  switch (module) {
    case "lesson-plans":
      return updateOwned(TeacherLessonPlan);
    case "planner":
      return updateOwned(TeacherPlannerEntry);
    case "attendance":
      return updateOwned(TeacherClassAttendance);
    case "gradebook":
      if (body.kind === "assignment") return updateOwned(TeacherGradeAssignment);
      return updateOwned(TeacherGradeScore);
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
  const sessionResult = await requireTutorPortal();
  if ("error" in sessionResult) return sessionResult.error;

  const { module: rawModule } = await context.params;
  const module = parseModule(rawModule);
  if (!module) return jsonError("Unknown workspace module", 404);

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
    "field-trips": TeacherFieldTrip,
    standards: TeacherStandardCoverage,
    documents: TeacherDocumentFile,
  };

  if (module === "gradebook") {
    const kind = request.nextUrl.searchParams.get("kind");
    const Model = (kind === "assignment" ? TeacherGradeAssignment : TeacherGradeScore) as DeletableModel;
    const deleted = await Model.findOneAndDelete({ _id: id, teacherId });
    if (!deleted) return jsonError("Not found", 404);
    if (kind === "assignment") {
      await (TeacherGradeScore as DeletableModel).deleteMany?.({ assignmentId: id, teacherId });
    }
    return jsonOk({ ok: true });
  }

  const Model = models[module];
  if (!Model) return jsonError("DELETE not supported", 400);

  const deleted = await Model.findOneAndDelete({ _id: id, teacherId });
  if (!deleted) return jsonError("Not found", 404);
  return jsonOk({ ok: true });
}

import { Course, Program, Event } from "@/models";

export async function resolveCertificateAssociations(data: {
  courseId?: string;
  programId?: string;
  eventId?: string;
}): Promise<{
  courseId?: string;
  programId?: string;
  eventId?: string;
  associatedCourse?: string;
  associatedProgram?: string;
  associatedEvent?: string;
}> {
  const { courseId, programId, eventId } = data;
  const result: {
    courseId?: string;
    programId?: string;
    eventId?: string;
    associatedCourse?: string;
    associatedProgram?: string;
    associatedEvent?: string;
  } = {};

  if (courseId) {
    const course = await Course.findById(courseId).select("title").lean();
    if (course) {
      result.courseId = courseId;
      result.associatedCourse = course.title;
    }
  }

  if (programId) {
    const program = await Program.findById(programId).select("title").lean();
    if (program) {
      result.programId = programId;
      result.associatedProgram = program.title;
    }
  }

  if (eventId) {
    const event = await Event.findById(eventId).select("title").lean();
    if (event) {
      result.eventId = eventId;
      result.associatedEvent = event.title;
    }
  }

  return result;
}

export function clearCertificateAssociationFields(): Record<string, null> {
  return {
    courseId: null,
    programId: null,
    eventId: null,
    associatedCourse: null,
    associatedProgram: null,
    associatedEvent: null,
  };
}

import { z } from "zod";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { createStudentAccount } from "@/lib/students/create-student-account";

const PARENT_PORTAL_ROLES = ["parent", "administrator"] as const;

const bodySchema = z.object({
  name: z.string().min(2, "Student name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  email: z.string().optional(),
  grade: z.string().optional(),
  dateOfBirth: z.string().optional(),
  relationship: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole([...PARENT_PORTAL_ROLES]);
    if ("error" in sessionResult) return sessionResult.error;

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return apiError(new Error("Invalid JSON body"), 400);
    }

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid student data";
      return apiError(new Error(message), 400);
    }

    const { name, password, grade, dateOfBirth, relationship } = parsed.data;
    const email = parsed.data.email?.trim().toLowerCase();
    if (email && !z.string().email().safeParse(email).success) {
      return apiError(new Error("Enter a valid email or leave it blank"), 400);
    }

    const created = await createStudentAccount({
      name,
      password,
      email: email || undefined,
      grade,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      guardianId: sessionResult.user.id,
      relationship,
      emailVerified: true,
    });

    return apiSuccess(
      {
        studentId: created.studentId,
        userId: created.userId,
        email: created.usedPlaceholderEmail ? undefined : created.email,
        usedPlaceholderEmail: created.usedPlaceholderEmail,
        message: `${name} is ready. Student ID: ${created.studentId}. They can sign in with that ID and the password you set.`,
      },
      201
    );
  } catch (error) {
    return apiError(error);
  }
}

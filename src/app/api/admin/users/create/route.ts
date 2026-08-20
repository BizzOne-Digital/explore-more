import { z } from "zod";
import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { ROLES } from "@/lib/constants";
import { createUserAccount } from "@/lib/admin/create-user";
import { STAFF_CATEGORIES } from "@/lib/portfolio/constants";

const createUserSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  role: z.enum(ROLES),
  emailVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
  staffTitle: z.string().optional(),
  staffCategories: z.array(z.enum(STAFF_CATEGORIES)).optional(),
  messagingAvailable: z.boolean().optional(),
  dateOfBirth: z.string().optional(),
  schoolStatus: z.enum(["homeschool", "traditional", "other"]).optional(),
  bio: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError(new Error("Invalid JSON body"), 400);
    }

    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(new Error(parsed.error.issues[0]?.message ?? "Invalid data"), 400);
    }

    await connectDB();
    const user = await createUserAccount(parsed.data);

    return apiSuccess(
      {
        user,
        loginHint:
          parsed.data.role === "staff" || parsed.data.role === "instructor"
            ? "Staff can sign in at /staff/login"
            : parsed.data.role === "parent"
              ? "Parent can sign in at /parent/login"
              : parsed.data.role === "student"
                ? "Student can sign in at /student/login"
                : "Administrator can sign in at /admin/login",
      },
      201
    );
  } catch (error) {
    return apiError(error);
  }
}

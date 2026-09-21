import connectDB from "@/lib/db";
import { User, StudentProfile } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { createStudentAccount } from "@/lib/students/create-student-account";
import { isStudentPlaceholderEmail } from "@/lib/students/placeholder-email";

export async function GET() {
  try {
    await connectDB();
    const items = await User.find({ role: "student" })
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .lean();
    return apiSuccess(items);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return apiError(new Error("Name is required"), 400);

    const emailRaw = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const passwordRaw = typeof body.password === "string" ? body.password : "";
    const autoPassword = Math.random().toString(36).slice(-8) + "A1";
    const password = passwordRaw.length >= 8 ? passwordRaw : autoPassword;
    const usedAutoPassword = passwordRaw.length < 8;

    const created = await createStudentAccount({
      name,
      password,
      email: emailRaw || undefined,
      grade: typeof body.grade === "string" ? body.grade : undefined,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      emailVerified: Boolean(body.emailVerified) || !emailRaw,
    });

    const user = await User.findByIdAndUpdate(
      created.userId,
      {
        phone: body.phone || undefined,
        isActive: body.isActive ?? true,
        emailVerified: body.emailVerified ?? !emailRaw,
      },
      { new: true }
    ).select("-passwordHash");

    await StudentProfile.findOneAndUpdate(
      { userId: created.userId },
      {
        schoolStatus: body.schoolStatus || undefined,
        bio: body.bio || undefined,
      },
      { new: true }
    );

    const displayEmail = isStudentPlaceholderEmail(created.email) ? undefined : created.email;

    return apiSuccess(
      {
        user: { ...user?.toObject(), studentId: created.studentId, email: displayEmail ?? created.email },
        tempPassword: usedAutoPassword ? password : undefined,
        studentId: created.studentId,
      },
      201
    );
  } catch (error) {
    return apiError(error);
  }
}

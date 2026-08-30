import { User, StudentProfile, ParentProfile, StaffProfile } from "@/models";
import { hashPassword } from "@/lib/password";
import type { Role } from "@/lib/constants";
import type { StaffCategory } from "@/lib/portfolio/constants";
import { ensureTutorId } from "@/lib/tutor/tutor-id";

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
  emailVerified?: boolean;
  isActive?: boolean;
  staffTitle?: string;
  staffCategories?: StaffCategory[];
  messagingAvailable?: boolean;
  dateOfBirth?: string;
  schoolStatus?: "homeschool" | "traditional" | "other";
  bio?: string;
}

export async function createUserAccount(input: CreateUserInput) {
  const email = input.email.toLowerCase().trim();
  const existing = await User.findOne({ email });
  if (existing) {
    throw new Error("A user with this email already exists");
  }

  const user = await User.create({
    name: input.name.trim(),
    email,
    phone: input.phone?.trim() || undefined,
    passwordHash: await hashPassword(input.password),
    role: input.role,
    emailVerified: input.emailVerified ?? true,
    isActive: input.isActive ?? true,
  });

  if (input.role === "student" && (input.dateOfBirth || input.schoolStatus || input.bio)) {
    await StudentProfile.create({
      userId: user._id,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
      schoolStatus: input.schoolStatus,
      bio: input.bio,
    });
  }

  if (input.role === "parent") {
    await ParentProfile.findOneAndUpdate(
      { userId: user._id },
      { userId: user._id },
      { upsert: true, new: true }
    );
  }

  if (["staff", "instructor", "administrator"].includes(input.role)) {
    const defaultCategories: StaffCategory[] =
      input.role === "administrator"
        ? ["administration"]
        : input.role === "instructor"
          ? ["tutor"]
          : input.staffCategories?.length
            ? input.staffCategories
            : ["administration"];

    await StaffProfile.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        title:
          input.staffTitle?.trim() ||
          (input.role === "administrator"
            ? "Administrator"
            : input.role === "instructor"
              ? "Instructor"
              : "Staff Member"),
        categories: input.staffCategories?.length ? input.staffCategories : defaultCategories,
        messagingAvailable: input.messagingAvailable ?? true,
        isPublished: true,
      },
      { upsert: true, new: true }
    );
  }

  if (input.role === "instructor" || input.role === "administrator") {
    await ensureTutorId(user._id.toString());
  }

  const fresh = await User.findById(user._id).select("-passwordHash").lean();
  const obj = fresh ?? user.toObject();
  const { passwordHash: _, ...safeUser } = obj as typeof user & { passwordHash?: string };
  return safeUser;
}

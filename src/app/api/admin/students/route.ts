import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User, StudentProfile } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import bcrypt from "bcryptjs";

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
    
    // Create user with temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    
    const userData = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      passwordHash,
      role: "student" as const,
      isActive: body.isActive ?? true,
      emailVerified: body.emailVerified ?? false,
    };

    const user = await User.create(userData);

    await StudentProfile.findOneAndUpdate(
      { userId: user._id },
      {
        dateOfBirth: body.dateOfBirth,
        schoolStatus: body.schoolStatus,
        bio: body.bio,
        grade: body.grade || undefined,
      },
      { upsert: true, new: true }
    );

    return apiSuccess({ user, tempPassword }, 201);
  } catch (error) {
    return apiError(error);
  }
}

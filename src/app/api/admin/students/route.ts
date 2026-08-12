import connectDB from "@/lib/db";
import { User, StudentProfile } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";

export async function GET() {
  try {
    await connectDB();
    const students = await User.find({ role: "student" }).sort({ createdAt: -1 }).lean();
    const profiles = await StudentProfile.find().lean();
    const profileMap = Object.fromEntries(profiles.map((p) => [String(p.userId), p]));
    const items = students.map((s) => ({ ...s, profile: profileMap[String(s._id)] ?? null }));
    return apiSuccess(items);
  } catch (error) {
    return apiError(error);
  }
}

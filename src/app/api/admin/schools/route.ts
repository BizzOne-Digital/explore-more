import connectDB from "@/lib/db";
import { School, TeacherSchoolMembership } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  district: z.string().optional(),
});

const assignSchema = z.object({
  userId: z.string().min(1),
  schoolId: z.string().min(1),
  jobTitle: z.string().optional(),
});

export async function GET() {
  try {
    await connectDB();
    const schools = await School.find({ isActive: { $ne: false } }).sort({ name: 1 }).lean();
    return apiSuccess({ schools });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return apiError(new Error("Invalid school data"));

    await connectDB();
    const school = await School.create({
      name: parsed.data.name.trim(),
      slug: parsed.data.slug.toLowerCase().trim(),
      district: parsed.data.district?.trim(),
    });
    return apiSuccess({ school }, 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const parsed = assignSchema.safeParse(body);
    if (!parsed.success) return apiError(new Error("Invalid assignment"));

    await connectDB();
    const membership = await TeacherSchoolMembership.findOneAndUpdate(
      { userId: parsed.data.userId },
      {
        $set: {
          userId: parsed.data.userId,
          schoolId: parsed.data.schoolId,
          jobTitle: parsed.data.jobTitle,
          isPrimary: true,
        },
      },
      { upsert: true, new: true }
    );
    return apiSuccess({ membership });
  } catch (error) {
    return apiError(error);
  }
}

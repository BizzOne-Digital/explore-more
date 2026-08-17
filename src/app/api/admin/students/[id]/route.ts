import connectDB from "@/lib/db";
import { User, StudentProfile } from "@/models";
import { apiSuccess, apiError, notFound, isValidObjectId } from "@/lib/admin/api";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return notFound();
    
    await connectDB();
    const user = await User.findOne({ _id: id, role: "student" })
      .select("-passwordHash")
      .lean();
    if (!user) return notFound();
    
    const profile = await StudentProfile.findOne({ userId: id }).lean();
    
    return apiSuccess({ user, profile });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return notFound();
    
    await connectDB();
    const body = await request.json();
    
    // Update user
    const userData = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      isActive: body.isActive,
      emailVerified: body.emailVerified,
    };
    
    const user = await User.findByIdAndUpdate(id, userData, { new: true, runValidators: true })
      .select("-passwordHash")
      .lean();
    if (!user) return notFound();
    
    // Update or create profile
    if (body.dateOfBirth || body.schoolStatus || body.bio) {
      await StudentProfile.findOneAndUpdate(
        { userId: id },
        {
          dateOfBirth: body.dateOfBirth,
          schoolStatus: body.schoolStatus,
          bio: body.bio,
        },
        { upsert: true, new: true }
      );
    }
    
    return apiSuccess(user);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return notFound();
    
    await connectDB();
    const user = await User.findOneAndDelete({ _id: id, role: "student" });
    if (!user) return notFound();
    
    // Delete associated profile
    await StudentProfile.findOneAndDelete({ userId: id });
    
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}

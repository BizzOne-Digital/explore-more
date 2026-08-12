import connectDB from "@/lib/db";
import { User } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { hashPassword } from "@/lib/password";

export async function GET() {
  try {
    await connectDB();
    const users = await User.find().select("-passwordHash").sort({ createdAt: -1 }).lean();
    return apiSuccess(users);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { password, ...rest } = body;
    const payload = {
      ...rest,
      ...(password ? { passwordHash: await hashPassword(password) } : {}),
    };
    const user = await User.create(payload);
    const obj = user.toObject();
    const { passwordHash: _, ...result } = obj;
    return apiSuccess(result, 201);
  } catch (error) {
    return apiError(error);
  }
}

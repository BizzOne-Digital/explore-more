import connectDB from "@/lib/db";
import { User } from "@/models";

export async function getUserAvatar(userId: string): Promise<string | undefined> {
  await connectDB();
  const user = await User.findById(userId).select("avatar").lean();
  const avatar = user?.avatar;
  return typeof avatar === "string" && avatar.length > 0 ? avatar : undefined;
}

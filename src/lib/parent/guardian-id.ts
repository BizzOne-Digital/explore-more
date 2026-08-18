import connectDB from "@/lib/db";
import { User } from "@/models";

export function generateGuardianId(): string {
  const suffix = Math.floor(Math.random() * 900000 + 100000);
  return `PG-${suffix}`;
}

export async function ensureGuardianId(userId: string): Promise<string | undefined> {
  await connectDB();
  const user = await User.findOne({ _id: userId, role: "parent" });
  if (!user) return undefined;

  if (!user.guardianId) {
    let code = generateGuardianId();
    let exists = await User.findOne({ guardianId: code });
    while (exists) {
      code = generateGuardianId();
      exists = await User.findOne({ guardianId: code });
    }
    user.guardianId = code;
    await user.save();
  }

  return user.guardianId;
}

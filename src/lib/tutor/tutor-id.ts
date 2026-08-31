import connectDB from "@/lib/db";
import { User } from "@/models";

/** Six-digit tutor identification number (never reused). */
export function generateTutorIdCode(): string {
  return String(Math.floor(Math.random() * 900000 + 100000));
}

export async function ensureTutorId(userId: string): Promise<string | undefined> {
  await connectDB();
  const user = await User.findOne({
    _id: userId,
    role: { $in: ["instructor", "administrator"] },
  });
  if (!user) return undefined;

  if (!user.tutorId) {
    let code = generateTutorIdCode();
    let exists = await User.findOne({ tutorId: code });
    while (exists) {
      code = generateTutorIdCode();
      exists = await User.findOne({ tutorId: code });
    }
    user.tutorId = code;
    await user.save();
  }

  return user.tutorId;
}

export async function findTutorByTutorId(tutorId: string) {
  await connectDB();
  const normalized = tutorId.trim();
  return User.findOne({
    tutorId: normalized,
    role: { $in: ["instructor", "administrator"] },
    isActive: { $ne: false },
  }).lean();
}

/** Assign 6-digit Tutor IDs to instructors and administrators missing one. */
export async function ensureAllTutorIds(): Promise<number> {
  await connectDB();
  const tutors = await User.find({
    role: { $in: ["instructor", "administrator"] },
  }).select("_id tutorId");

  let assigned = 0;
  for (const user of tutors) {
    if (!user.tutorId) {
      await ensureTutorId(user._id.toString());
      assigned++;
    }
  }

  return assigned;
}

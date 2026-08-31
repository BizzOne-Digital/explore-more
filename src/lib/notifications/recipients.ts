import { User, GuardianStudentLink, Enrollment } from "@/models";
import type { NotificationAudience } from "@/lib/portfolio/constants";

const ACTIVE_PARENT_FILTER = { role: "parent" as const, isActive: { $ne: false } };

export type BroadcastAudience = Extract<
  NotificationAudience,
  "all_parents" | "portfolio_parents" | "tutoring_parents" | "custom"
>;

export async function resolveNotificationRecipients(
  audience: BroadcastAudience
): Promise<string[]> {
  switch (audience) {
    case "all_parents": {
      const parents = await User.find(ACTIVE_PARENT_FILTER).select("_id").lean();
      return parents.map((p) => p._id.toString());
    }

    case "portfolio_parents": {
      const { HomeschoolPortfolio } = await import("@/models/Portfolio");
      const [portfolioGuardianIds, linkedGuardianIds] = await Promise.all([
        HomeschoolPortfolio.distinct("guardianId"),
        GuardianStudentLink.distinct("guardianId", { status: "approved" }),
      ]);

      const uniqueIds = [
        ...new Set([
          ...portfolioGuardianIds.map((id) => id.toString()),
          ...linkedGuardianIds.map((id) => id.toString()),
        ]),
      ];

      if (uniqueIds.length === 0) return [];

      const parents = await User.find({
        _id: { $in: uniqueIds },
        ...ACTIVE_PARENT_FILTER,
      })
        .select("_id")
        .lean();

      return parents.map((p) => p._id.toString());
    }

    case "tutoring_parents": {
      const enrolledUserIds = await Enrollment.distinct("userId", {
        status: { $ne: "cancelled" },
      });

      if (enrolledUserIds.length === 0) return [];

      const enrolledUsers = await User.find({ _id: { $in: enrolledUserIds } })
        .select("_id role")
        .lean();

      const studentIds = enrolledUsers
        .filter((user) => user.role === "student")
        .map((user) => user._id);

      const parentIdsFromStudents =
        studentIds.length > 0
          ? await GuardianStudentLink.distinct("guardianId", {
              studentId: { $in: studentIds },
              status: "approved",
            })
          : [];

      const directParentIds = enrolledUsers
        .filter((user) => user.role === "parent")
        .map((user) => user._id.toString());

      const uniqueIds = [
        ...new Set([
          ...parentIdsFromStudents.map((id) => id.toString()),
          ...directParentIds,
        ]),
      ];

      if (uniqueIds.length === 0) return [];

      const parents = await User.find({
        _id: { $in: uniqueIds },
        ...ACTIVE_PARENT_FILTER,
      })
        .select("_id")
        .lean();

      return parents.map((p) => p._id.toString());
    }

    case "custom":
      return [];
  }
}

export function noRecipientsMessage(audience: BroadcastAudience): string {
  switch (audience) {
    case "all_parents":
      return "No parent accounts found yet. Parents can sign up at /parent/signup, or you can create accounts under Admin → Users.";
    case "portfolio_parents":
      return "No portfolio parents found. Create parent accounts, link them to students, and set up homeschool portfolios first.";
    case "tutoring_parents":
      return "No tutoring parents found. Enroll students in courses and link their parent/guardian accounts first.";
    case "custom":
      return "Select at least one parent account.";
  }
}

export function allowsEmptyRecipients(audience: BroadcastAudience): boolean {
  return audience === "all_parents";
}

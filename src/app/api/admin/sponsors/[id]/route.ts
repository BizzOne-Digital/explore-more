import connectDB from "@/lib/db";
import mongoose from "mongoose";
import { Sponsor, SponsorNote, SponsorContribution } from "@/models";
import { getSponsorDonations, getSponsorContributions } from "@/lib/sponsors/sync";
import { resolveAccountManagerFields } from "@/lib/sponsors/account-manager";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, isValidObjectId } from "@/lib/admin/api";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(new Error("Invalid sponsor id"), 400);

    await connectDB();
    const sponsor = await Sponsor.findById(id).lean();
    if (!sponsor) return apiError(new Error("Sponsor not found"), 404);

    const [donations, contributions, notes] = await Promise.all([
      getSponsorDonations(sponsor.email),
      getSponsorContributions(id),
      SponsorNote.find({ sponsorId: id }).sort({ createdAt: -1 }).lean(),
    ]);

    return apiSuccess({ sponsor, donations, contributions, notes });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError(new Error("Unauthorized"), 401);

    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(new Error("Invalid sponsor id"), 400);

    await connectDB();
    const body = await request.json();
    const existing = await Sponsor.findById(id);
    if (!existing) return apiError(new Error("Sponsor not found"), 404);

    const allowed = [
      "name",
      "email",
      "phone",
      "organization",
      "status",
      "type",
      "source",
      "tags",
      "adminNotes",
      "contractNotes",
      "nextFollowUpAt",
      "address",
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) {
        updates[key] = body[key];
      }
    }

    if (typeof updates.email === "string") {
      updates.email = updates.email.trim().toLowerCase();
    }
    if (updates.nextFollowUpAt) {
      updates.nextFollowUpAt = new Date(String(updates.nextFollowUpAt));
    }

    const unsetFields: string[] = [];
    if ("accountManagerId" in body && session.user.role === "administrator") {
      const newManagerId = body.accountManagerId;

      if (newManagerId === null || newManagerId === "") {
        unsetFields.push("accountManagerId", "accountManagerName", "accountManagerStaffId");

        const previousName = existing.accountManagerName;
        if (existing.accountManagerId) {
          await SponsorNote.create({
            sponsorId: existing._id,
            createdBy: new mongoose.Types.ObjectId(session.user.id),
            staffName: session.user.name ?? "Administrator",
            type: "note",
            subject: "Account manager removed",
            content: `Account manager ${previousName ?? "assignment"} was removed.`,
            followUpCompleted: true,
          });
        }
      } else if (typeof newManagerId === "string" && isValidObjectId(newManagerId)) {
        const managerFields = await resolveAccountManagerFields(newManagerId);
        if (!managerFields) {
          return apiError(new Error("Invalid account manager — staff member not found"), 400);
        }

        const previousName = existing.accountManagerName;
        const previousStaffId = existing.accountManagerStaffId;
        const changed =
          String(existing.accountManagerId ?? "") !== managerFields.accountManagerId;

        updates.accountManagerId = new mongoose.Types.ObjectId(managerFields.accountManagerId);
        updates.accountManagerName = managerFields.accountManagerName;
        updates.accountManagerStaffId = managerFields.accountManagerStaffId;

        if (changed) {
          const fromLabel = previousName
            ? `${previousName}${previousStaffId ? ` (${previousStaffId})` : ""}`
            : "Unassigned";
          const toLabel = `${managerFields.accountManagerName}${
            managerFields.accountManagerStaffId ? ` (${managerFields.accountManagerStaffId})` : ""
          }`;

          await SponsorNote.create({
            sponsorId: existing._id,
            createdBy: new mongoose.Types.ObjectId(session.user.id),
            staffName: session.user.name ?? "Administrator",
            type: "note",
            subject: "Account manager transferred",
            content: `Account manager changed from ${fromLabel} to ${toLabel}.`,
            followUpCompleted: true,
          });
        }
      } else {
        return apiError(new Error("Invalid account manager id"), 400);
      }
    }

    const updateQuery: Record<string, unknown> = {};
    if (Object.keys(updates).length > 0) updateQuery.$set = updates;
    if (unsetFields.length > 0) {
      updateQuery.$unset = Object.fromEntries(unsetFields.map((f) => [f, ""]));
    }

    const sponsor = await Sponsor.findByIdAndUpdate(
      id,
      Object.keys(updateQuery).length > 0 ? updateQuery : updates,
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!sponsor) return apiError(new Error("Sponsor not found"), 404);
    return apiSuccess(sponsor);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(new Error("Invalid sponsor id"), 400);

    await connectDB();
    await SponsorContribution.deleteMany({ sponsorId: id });
    await SponsorNote.deleteMany({ sponsorId: id });
    const sponsor = await Sponsor.findByIdAndDelete(id);
    if (!sponsor) return apiError(new Error("Sponsor not found"), 404);

    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}

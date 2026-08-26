import connectDB from "@/lib/db";
import { Sponsor, SponsorNote, SponsorContribution } from "@/models";
import { getSponsorDonations, getSponsorContributions } from "@/lib/sponsors/sync";
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
    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(new Error("Invalid sponsor id"), 400);

    await connectDB();
    const body = await request.json();

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

    const sponsor = await Sponsor.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).lean();

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

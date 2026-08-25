import connectDB from "@/lib/db";
import { Sponsor } from "@/models";
import { syncAllSponsorsFromDonations } from "@/lib/sponsors/sync";
import { apiSuccess, apiError } from "@/lib/admin/api";

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase();
    const status = searchParams.get("status");
    const sync = searchParams.get("sync") === "1";

    if (sync) {
      await syncAllSponsorsFromDonations();
    }

    const filter: Record<string, unknown> = {};
    if (status && status !== "all") {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { organization: { $regex: search, $options: "i" } },
      ];
    }

    const sponsors = await Sponsor.find(filter).sort({ lastDonationAt: -1, updatedAt: -1 }).lean();

    const stats = {
      total: await Sponsor.countDocuments(),
      active: await Sponsor.countDocuments({ status: { $in: ["active", "major"] } }),
      major: await Sponsor.countDocuments({ status: "major" }),
      leads: await Sponsor.countDocuments({ status: { $in: ["lead", "prospect"] } }),
      followUpsDue: await Sponsor.countDocuments({
        nextFollowUpAt: { $lte: new Date() },
        status: { $nin: ["inactive"] },
      }),
      totalRaisedCents: (
        await Sponsor.aggregate([{ $group: { _id: null, total: { $sum: "$totalDonatedCents" } } }])
      )[0]?.total ?? 0,
    };

    return apiSuccess({ sponsors, stats });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!email || !name) {
      return apiError(new Error("Name and email are required"), 400);
    }

    const existing = await Sponsor.findOne({ email });
    if (existing) {
      return apiError(new Error("A sponsor with this email already exists"), 409);
    }

    const sponsor = await Sponsor.create({
      name,
      email,
      phone: body.phone,
      organization: body.organization,
      status: body.status ?? "lead",
      type: body.type ?? "individual",
      source: body.source ?? "manual",
      tags: Array.isArray(body.tags) ? body.tags : [],
      adminNotes: body.adminNotes,
      nextFollowUpAt: body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : undefined,
    });

    return apiSuccess(sponsor, 201);
  } catch (error) {
    return apiError(error);
  }
}

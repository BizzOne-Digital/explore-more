import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { Sponsor, SponsorContribution, Program, User } from "@/models";
import { recalculateSponsorTotals } from "@/lib/sponsors/totals";
import { apiSuccess, apiError, isValidObjectId } from "@/lib/admin/api";

type RouteParams = { params: Promise<{ id: string }> };

const PAYMENT_METHODS = ["check", "cash", "card_phone", "ach", "online", "other"] as const;

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(new Error("Invalid sponsor id"), 400);

    await connectDB();
    const contributions = await SponsorContribution.find({ sponsorId: id })
      .sort({ contributionDate: -1, createdAt: -1 })
      .lean();

    return apiSuccess(contributions);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError(new Error("Unauthorized"), 401);

    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(new Error("Invalid sponsor id"), 400);

    await connectDB();
    const sponsor = await Sponsor.findById(id);
    if (!sponsor) return apiError(new Error("Sponsor not found"), 404);

    const body = await request.json();
    const amountCents = Number(body.amountCents);
    if (!Number.isFinite(amountCents) || amountCents < 100) {
      return apiError(new Error("Amount must be at least $1.00"), 400);
    }

    const paymentMethod =
      typeof body.paymentMethod === "string" && PAYMENT_METHODS.includes(body.paymentMethod)
        ? body.paymentMethod
        : "other";

    let programId: string | undefined;
    let programTitle: string | undefined;

    if (body.programId && isValidObjectId(body.programId)) {
      const program = await Program.findById(body.programId).select("title").lean();
      if (program) {
        programId = body.programId;
        programTitle = program.title;
      }
    }

    const staff = await User.findById(session.user.id).select("name").lean();
    const contributionDate = body.contributionDate
      ? new Date(body.contributionDate)
      : new Date();

    const contribution = await SponsorContribution.create({
      sponsorId: id,
      amountCents: Math.round(amountCents),
      paymentMethod,
      paymentStatus: "paid",
      programId,
      programTitle,
      notes: typeof body.notes === "string" ? body.notes.trim() : undefined,
      recordedBy: session.user.id,
      recordedByName: staff?.name ?? "Admin",
      contributionDate,
    });

    await recalculateSponsorTotals(id);

    const sponsorUpdated = await Sponsor.findById(id).lean();
    return apiSuccess({ contribution, sponsor: sponsorUpdated }, 201);
  } catch (error) {
    return apiError(error);
  }
}

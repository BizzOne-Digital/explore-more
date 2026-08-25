import connectDB from "@/lib/db";
import { Donation, Sponsor } from "@/models";
import type { SponsorStatus } from "@/models/Sponsor";

const MAJOR_DONOR_CENTS = 50_000;

function statusFromTotal(totalCents: number): SponsorStatus {
  if (totalCents >= MAJOR_DONOR_CENTS) return "major";
  if (totalCents > 0) return "active";
  return "lead";
}

export async function upsertSponsorFromDonation(donation: {
  donorEmail: string;
  donorName: string;
  amountCents: number;
  isAnonymous?: boolean;
  userId?: string;
  donatedAt?: Date;
}) {
  const email = donation.donorEmail.toLowerCase().trim();
  if (!email) return null;

  await connectDB();

  const donatedAt = donation.donatedAt ?? new Date();
  const displayName = donation.isAnonymous ? "Anonymous Sponsor" : donation.donorName.trim() || email;

  let sponsor = await Sponsor.findOne({ email });

  if (sponsor) {
    sponsor.totalDonatedCents += donation.amountCents;
    sponsor.donationCount += 1;
    sponsor.lastDonationAt = donatedAt;
    sponsor.firstDonationAt = sponsor.firstDonationAt ?? donatedAt;
    if (!donation.isAnonymous && donation.donorName.trim()) {
      sponsor.name = donation.donorName.trim();
    }
    if (donation.userId && !sponsor.userId) {
      sponsor.userId = donation.userId;
    }
    sponsor.status = statusFromTotal(sponsor.totalDonatedCents);
    await sponsor.save();
    return sponsor;
  }

  sponsor = await Sponsor.create({
    email,
    name: displayName,
    totalDonatedCents: donation.amountCents,
    donationCount: 1,
    firstDonationAt: donatedAt,
    lastDonationAt: donatedAt,
    userId: donation.userId,
    status: statusFromTotal(donation.amountCents),
    source: "website",
    type: "individual",
  });

  return sponsor;
}

/** Rebuild sponsor totals from paid donations (safe to run multiple times). */
export async function syncAllSponsorsFromDonations(): Promise<{ synced: number }> {
  await connectDB();

  const paidDonations = await Donation.find({ paymentStatus: "paid" })
    .sort({ createdAt: 1 })
    .lean();

  const byEmail = new Map<
    string,
    {
      name: string;
      totalCents: number;
      count: number;
      firstAt?: Date;
      lastAt?: Date;
      userId?: string;
    }
  >();

  for (const donation of paidDonations) {
    const email = donation.donorEmail.toLowerCase().trim();
    if (!email) continue;

    const name = donation.isAnonymous ? "Anonymous Sponsor" : donation.donorName;
    const existing = byEmail.get(email);

    if (existing) {
      existing.totalCents += donation.amountCents;
      existing.count += 1;
      existing.lastAt = donation.createdAt;
      if (!donation.isAnonymous && donation.donorName) {
        existing.name = donation.donorName;
      }
      if (donation.userId && !existing.userId) {
        existing.userId = donation.userId.toString();
      }
    } else {
      byEmail.set(email, {
        name,
        totalCents: donation.amountCents,
        count: 1,
        firstAt: donation.createdAt,
        lastAt: donation.createdAt,
        userId: donation.userId?.toString(),
      });
    }
  }

  for (const [email, data] of byEmail) {
    const existing = await Sponsor.findOne({ email });
    let status = existing?.status ?? statusFromTotal(data.totalCents);
    if (existing) {
      if (existing.status === "lead" || existing.status === "prospect") {
        status = statusFromTotal(data.totalCents);
      } else if (data.totalCents >= MAJOR_DONOR_CENTS && existing.status === "active") {
        status = "major";
      } else {
        status = existing.status;
      }
    }

    await Sponsor.findOneAndUpdate(
      { email },
      {
        name: data.name,
        email,
        totalDonatedCents: data.totalCents,
        donationCount: data.count,
        firstDonationAt: data.firstAt,
        lastDonationAt: data.lastAt,
        userId: data.userId ?? existing?.userId,
        status,
        source: existing?.source ?? "website",
        type: existing?.type ?? "individual",
        phone: existing?.phone,
        organization: existing?.organization,
        adminNotes: existing?.adminNotes,
        nextFollowUpAt: existing?.nextFollowUpAt,
        tags: existing?.tags ?? [],
      },
      { upsert: true, new: true }
    );
  }

  const count = await Sponsor.countDocuments();
  return { synced: count };
}

export async function getSponsorDonations(email: string) {
  await connectDB();
  return Donation.find({
    donorEmail: email.toLowerCase(),
    paymentStatus: "paid",
  })
    .populate("campaignId", "title slug")
    .sort({ createdAt: -1 })
    .lean();
}

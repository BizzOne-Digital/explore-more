import connectDB from "@/lib/db";
import mongoose from "mongoose";
import { Donation, Sponsor, SponsorContribution } from "@/models";
import { recalculateSponsorTotals } from "@/lib/sponsors/totals";

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

  const displayName = donation.isAnonymous ? "Anonymous Sponsor" : donation.donorName.trim() || email;

  let sponsor = await Sponsor.findOne({ email });

  if (!sponsor) {
    sponsor = await Sponsor.create({
      email,
      name: displayName,
      totalDonatedCents: 0,
      donationCount: 0,
      userId: donation.userId ? new mongoose.Types.ObjectId(donation.userId) : undefined,
      status: "lead",
      source: "website",
      type: "individual",
    });
  } else {
    if (!donation.isAnonymous && donation.donorName.trim()) {
      sponsor.name = donation.donorName.trim();
    }
    if (donation.userId && !sponsor.userId) {
      sponsor.userId = new mongoose.Types.ObjectId(donation.userId);
    }
    await sponsor.save();
  }

  await recalculateSponsorTotals(sponsor._id.toString());
  return Sponsor.findById(sponsor._id);
}

/** Rebuild sponsor records from paid donations and refresh totals (includes manual gifts). */
export async function syncAllSponsorsFromDonations(): Promise<{ synced: number }> {
  await connectDB();

  const paidDonations = await Donation.find({ paymentStatus: "paid" })
    .sort({ createdAt: 1 })
    .lean();

  for (const donation of paidDonations) {
    const email = donation.donorEmail.toLowerCase().trim();
    if (!email) continue;

    const name = donation.isAnonymous ? "Anonymous Sponsor" : donation.donorName;
    const existing = await Sponsor.findOne({ email });

    if (!existing) {
      await Sponsor.create({
        email,
        name,
        totalDonatedCents: 0,
        donationCount: 0,
        userId: donation.userId,
        status: "lead",
        source: "website",
        type: "individual",
      });
    } else {
      if (!donation.isAnonymous && donation.donorName) {
        existing.name = donation.donorName;
      }
      if (donation.userId && !existing.userId) {
        existing.userId = donation.userId;
      }
      await existing.save();
    }
  }

  const sponsors = await Sponsor.find().select("_id").lean();
  for (const sponsor of sponsors) {
    await recalculateSponsorTotals(sponsor._id.toString());
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
    .populate("programId", "title slug")
    .sort({ createdAt: -1 })
    .lean();
}

export async function getSponsorContributions(sponsorId: string) {
  await connectDB();
  return SponsorContribution.find({ sponsorId })
    .sort({ contributionDate: -1, createdAt: -1 })
    .lean();
}

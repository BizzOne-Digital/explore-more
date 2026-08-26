import connectDB from "@/lib/db";
import { Donation, Sponsor, SponsorContribution } from "@/models";
import type { SponsorStatus } from "@/models/Sponsor";

const MAJOR_DONOR_CENTS = 50_000;

export function statusFromTotalCents(totalCents: number): SponsorStatus {
  if (totalCents >= MAJOR_DONOR_CENTS) return "major";
  if (totalCents > 0) return "active";
  return "lead";
}

/** Recompute sponsor totals from paid donations + manual contributions. */
export async function recalculateSponsorTotals(sponsorId: string) {
  await connectDB();

  const sponsor = await Sponsor.findById(sponsorId);
  if (!sponsor) return null;

  const email = sponsor.email.toLowerCase().trim();
  const [donations, contributions] = await Promise.all([
    Donation.find({ donorEmail: email, paymentStatus: "paid" }).lean(),
    SponsorContribution.find({ sponsorId, paymentStatus: "paid" }).lean(),
  ]);

  let totalCents = 0;
  let count = 0;
  let firstAt: Date | undefined;
  let lastAt: Date | undefined;

  for (const donation of donations) {
    totalCents += donation.amountCents;
    count += 1;
    const at = donation.createdAt;
    if (!firstAt || at < firstAt) firstAt = at;
    if (!lastAt || at > lastAt) lastAt = at;
  }

  for (const contribution of contributions) {
    totalCents += contribution.amountCents;
    count += 1;
    const at = contribution.contributionDate ?? contribution.createdAt;
    if (!firstAt || at < firstAt) firstAt = at;
    if (!lastAt || at > lastAt) lastAt = at;
  }

  const previousStatus = sponsor.status;
  let status = statusFromTotalCents(totalCents);
  if (
    previousStatus !== "lead" &&
    previousStatus !== "prospect" &&
    previousStatus !== "inactive" &&
    previousStatus !== "lapsed"
  ) {
    if (totalCents >= MAJOR_DONOR_CENTS) {
      status = "major";
    } else if (totalCents > 0 && previousStatus === "major") {
      status = "active";
    } else if (totalCents > 0) {
      status = previousStatus === "major" ? "active" : previousStatus;
    }
  }

  sponsor.totalDonatedCents = totalCents;
  sponsor.donationCount = count;
  sponsor.firstDonationAt = firstAt;
  sponsor.lastDonationAt = lastAt;
  sponsor.status = status;
  await sponsor.save();

  return sponsor;
}

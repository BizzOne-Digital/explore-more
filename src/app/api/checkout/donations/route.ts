import { z } from "zod";
import connectDB from "@/lib/db";
import { DonationCampaign, Donation } from "@/models";
import { createCheckoutSession, getAppUrl, isStripeConfigured } from "@/lib/services/stripe";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth-helpers";

const checkoutSchema = z.object({
  campaignSlug: z.string().min(1),
  amountCents: z.number().int().min(100),
  donorName: z.string().min(1),
  donorEmail: z.string().email(),
  isAnonymous: z.boolean().optional(),
  message: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return jsonError("Payment system is not configured", 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  await connectDB();

  const campaign = await DonationCampaign.findOne({
    slug: parsed.data.campaignSlug,
    status: "published",
  });

  if (!campaign) {
    return jsonError("Campaign not found", 404);
  }

  if (
    !campaign.customAmountEnabled &&
    !campaign.suggestedAmounts.includes(parsed.data.amountCents)
  ) {
    return jsonError("Invalid donation amount for this campaign", 400);
  }

  const sessionResult = await requireSession();
  const userId = "error" in sessionResult ? undefined : sessionResult.user.id;

  const donation = await Donation.create({
    campaignId: campaign._id,
    userId,
    amountCents: parsed.data.amountCents,
    donorName: parsed.data.donorName,
    donorEmail: parsed.data.donorEmail,
    isAnonymous: parsed.data.isAnonymous ?? false,
    message: parsed.data.message,
    paymentStatus: "pending",
  });

  const appUrl = getAppUrl();
  const session = await createCheckoutSession({
    lineItems: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Donation: ${campaign.title}`,
            description: campaign.description.slice(0, 200),
          },
          unit_amount: parsed.data.amountCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      checkoutType: "donation",
      donationId: donation._id.toString(),
      campaignId: campaign._id.toString(),
    },
    customerEmail: parsed.data.donorEmail,
    successUrl: `${appUrl}/donate/${campaign.slug}?success=true`,
    cancelUrl: `${appUrl}/donate/${campaign.slug}`,
  });

  donation.stripeSessionId = session.id;
  await donation.save();

  return jsonOk({ sessionId: session.id, url: session.url });
}

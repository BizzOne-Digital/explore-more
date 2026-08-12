import { NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { DonationCampaign, Donation } from "@/models";
import { createCheckoutSession, getAppUrl, getStripe } from "@/lib/services/stripe";
import { auth } from "@/lib/auth";

const schema = z.object({
  campaignId: z.string(),
  campaignSlug: z.string(),
  amountCents: z.number().min(100),
  donorName: z.string().min(2),
  donorEmail: z.string().email(),
  message: z.string().optional(),
  isAnonymous: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    await connectDB();

    const campaign = await DonationCampaign.findOne({
      _id: data.campaignId,
      slug: data.campaignSlug,
      status: "published",
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const session = await auth();

    const donation = await Donation.create({
      campaignId: campaign._id,
      userId: session?.user?.id,
      amountCents: data.amountCents,
      donorName: data.donorName,
      donorEmail: data.donorEmail,
      isAnonymous: data.isAnonymous ?? false,
      message: data.message,
      paymentStatus: "pending",
    });

    const stripe = getStripe();
    if (!stripe) {
      await Donation.findByIdAndUpdate(donation._id, { paymentStatus: "paid" });
      await DonationCampaign.findByIdAndUpdate(campaign._id, {
        $inc: { raisedCents: data.amountCents },
      });
      return NextResponse.json({ success: true, manual: true });
    }

    const checkoutSession = await createCheckoutSession({
      lineItems: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Donation: ${campaign.title}` },
            unit_amount: data.amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        type: "donation",
        donationId: donation._id.toString(),
        campaignId: campaign._id.toString(),
      },
      customerEmail: data.donorEmail,
      successUrl: `${getAppUrl()}/sponsor-a-kid?donated=${campaign.slug}`,
      cancelUrl: `${getAppUrl()}/donate/${campaign.slug}`,
    });

    await Donation.findByIdAndUpdate(donation._id, { stripeSessionId: checkoutSession.id });

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid donation data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Donation failed" }, { status: 500 });
  }
}

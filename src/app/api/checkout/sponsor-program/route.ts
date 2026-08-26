import { NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { Program, Donation } from "@/models";
import { createCheckoutSession, getAppUrl, getStripe } from "@/lib/services/stripe";
import { auth } from "@/lib/auth";
import { sendDonationEmails } from "@/lib/email/donation-notifications";
import { stripeProductData } from "@/lib/stripe/tax-codes";

const schema = z.object({
  programSlug: z.string().min(1),
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

    const program = await Program.findOne({
      slug: data.programSlug,
      status: "published",
      sponsorshipEnabled: true,
    });

    if (!program) {
      return NextResponse.json({ error: "Program sponsorship not available" }, { status: 404 });
    }

    const session = await auth();

    const donation = await Donation.create({
      programId: program._id,
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
      await Donation.findByIdAndUpdate(donation._id, { paymentStatus: "paid", receiptSent: true });

      const { upsertSponsorFromDonation } = await import("@/lib/sponsors/sync");
      await upsertSponsorFromDonation({
        donorEmail: data.donorEmail,
        donorName: data.donorName,
        amountCents: data.amountCents,
        isAnonymous: data.isAnonymous,
        userId: session?.user?.id,
      }).catch((err) => console.error("[sponsor-program] CRM sync:", err));

      await sendDonationEmails({
        donation: {
          donationId: donation._id.toString(),
          donorName: data.donorName,
          donorEmail: data.donorEmail,
          amountCents: data.amountCents,
          isAnonymous: data.isAnonymous,
          message: data.message,
        },
        campaign: {
          title: `Program: ${program.title}`,
          slug: program.slug,
        },
      }).catch((err) => console.error("[email] program sponsorship:", err));

      return NextResponse.json({ success: true, manual: true });
    }

    const checkoutSession = await createCheckoutSession({
      lineItems: [
        {
          price_data: {
            currency: "usd",
            product_data: stripeProductData(
              { name: `Sponsor: ${program.title}` },
              "donations"
            ),
            unit_amount: data.amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        checkoutType: "donation",
        donationId: donation._id.toString(),
        programId: program._id.toString(),
      },
      customerEmail: data.donorEmail,
      managedPayments: false,
      successUrl: `${getAppUrl()}/sponsor-a-kid?sponsored=${program.slug}`,
      cancelUrl: `${getAppUrl()}/sponsor-a-kid/program/${program.slug}`,
    });

    await Donation.findByIdAndUpdate(donation._id, { stripeSessionId: checkoutSession.id });

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid sponsorship data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Sponsorship checkout failed" }, { status: 500 });
  }
}

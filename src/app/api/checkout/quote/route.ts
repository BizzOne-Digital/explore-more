import { NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { Book, SiteSettings } from "@/models";
import { getBookPriceCents, isBookPublished } from "@/lib/pricing";
import { isBookDigital } from "@/lib/books/is-digital";
import { buildCheckoutQuote } from "@/lib/orders/checkout-quote";

const itemSchema = z.object({
  bookId: z.string(),
  quantity: z.number().int().min(1).max(99),
});

const addressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().default("US"),
});

const quoteSchema = z.object({
  items: z.array(itemSchema).min(1),
  shippingAddress: addressSchema.optional(),
  shippingOptionId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = quoteSchema.parse(body);
    await connectDB();

    const settings = await SiteSettings.findOne().lean();
    const shippingLines: Array<{
      priceCents: number;
      quantity: number;
      isDigital: boolean;
    }> = [];

    for (const item of data.items) {
      const book = await Book.findById(item.bookId);
      if (!book || !isBookPublished(book)) {
        return NextResponse.json({ error: `Book not available: ${item.bookId}` }, { status: 404 });
      }

      shippingLines.push({
        priceCents: getBookPriceCents(book),
        quantity: item.quantity,
        isDigital: isBookDigital(book),
      });
    }

    const quote = await buildCheckoutQuote({
      items: shippingLines,
      shippingAddress: data.shippingAddress,
      shippingOptionId: data.shippingOptionId,
      siteSettings: settings
        ? {
            taxRatePercent: settings.taxRatePercent,
            shippingFlatCents: settings.shippingFlatCents,
            freeShippingThresholdCents: settings.freeShippingThresholdCents,
          }
        : undefined,
    });

    return NextResponse.json(quote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid quote request" }, { status: 400 });
    }
    console.error("Checkout quote error:", error);
    return NextResponse.json({ error: "Failed to calculate quote" }, { status: 500 });
  }
}

import {
  cartIsFreeOnly,
  cartRequiresShippingAddress,
  type BookShippingLine,
} from "@/lib/orders/book-shipping";
import { calculateBookTaxCents } from "@/lib/orders/calculate-book-tax";
import {
  findShippingOption,
  getShippingOptions,
  resolveShippingSettings,
  type ShippingAddress,
  type ShippingOption,
} from "@/lib/services/shipping-rates";

export type CheckoutQuoteInput = {
  items: BookShippingLine[];
  shippingAddress?: ShippingAddress;
  shippingOptionId?: string;
  donationCents?: number;
  siteSettings?: {
    taxRatePercent?: number;
    shippingFlatCents?: number;
    freeShippingThresholdCents?: number;
  };
};

export type CheckoutQuote = {
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  taxRatePercent: number;
  taxJurisdiction: string;
  shippingOptions: ShippingOption[];
  selectedShippingOptionId: string | null;
  needsAddress: boolean;
  isFreeCart: boolean;
  totalCents: number;
  liveShippingRates: boolean;
};

export async function buildCheckoutQuote(input: CheckoutQuoteInput): Promise<CheckoutQuote> {
  const { items, shippingAddress, shippingOptionId, siteSettings } = input;
  const shippingSettings = resolveShippingSettings(siteSettings);
  const fallbackTaxRate = siteSettings?.taxRatePercent ?? 0;

  const subtotalCents = items.reduce(
    (sum, item) => sum + item.priceCents * item.quantity,
    0
  );
  const needsAddress = cartRequiresShippingAddress(items);
  const isFreeCart = cartIsFreeOnly(items);

  let shippingOptions: ShippingOption[] = [];
  if (needsAddress) {
    shippingOptions = await getShippingOptions(items, shippingAddress, shippingSettings);
  }

  const selectedOption = findShippingOption(shippingOptions, shippingOptionId);
  const shippingCents = selectedOption?.rateCents ?? 0;

  const taxState =
    shippingAddress?.state ??
    (needsAddress ? "" : "");

  const tax = calculateBookTaxCents(
    items,
    shippingCents,
    taxState,
    fallbackTaxRate,
    input.donationCents ?? 0
  );

  const totalCents = subtotalCents + shippingCents + tax.taxCents;

  return {
    subtotalCents,
    shippingCents,
    taxCents: tax.taxCents,
    taxRatePercent: tax.taxRatePercent,
    taxJurisdiction: tax.jurisdiction,
    shippingOptions,
    selectedShippingOptionId: selectedOption?.id ?? null,
    needsAddress,
    isFreeCart,
    totalCents,
    liveShippingRates: Boolean(
      process.env.EASYPOST_API_KEY &&
        shippingOptions.length > 0 &&
        shippingOptions[0]?.id !== "standard"
    ),
  };
}

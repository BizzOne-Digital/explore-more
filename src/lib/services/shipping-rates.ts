import {
  BOOK_FLAT_SHIPPING_CENTS,
  BOOK_FREE_SHIPPING_THRESHOLD_CENTS,
  type BookShippingLine,
  calculateBookShippingCents,
} from "@/lib/orders/book-shipping";

export type ShippingAddress = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
};

export type ShippingOption = {
  id: string;
  carrier: string;
  service: string;
  rateCents: number;
  estimatedDays: number | null;
};

export type ShippingSettings = {
  flatCents?: number;
  freeThresholdCents?: number;
};

const DEFAULT_OZ_PER_BOOK = 16;
const DEFAULT_PARCEL = { length: 9, width: 6, height: 2 };

function getShipFromAddress() {
  return {
    name: process.env.SHIPPING_FROM_NAME || "Explore More Academy",
    street1: process.env.SHIPPING_FROM_LINE1 || "3890 Smallwood Church Rd",
    street2: process.env.SHIPPING_FROM_LINE2 || "",
    city: process.env.SHIPPING_FROM_CITY || "Indian Head",
    state: process.env.SHIPPING_FROM_STATE || "MD",
    zip: process.env.SHIPPING_FROM_ZIP || "20640",
    country: process.env.SHIPPING_FROM_COUNTRY || "US",
    phone: process.env.SHIPPING_FROM_PHONE || "",
  };
}

function packageWeightOz(items: BookShippingLine[]): number {
  const physicalQty = items
    .filter((item) => !item.isDigital && item.priceCents >= 0)
    .reduce((sum, item) => sum + item.quantity, 0);
  return Math.max(DEFAULT_OZ_PER_BOOK, physicalQty * DEFAULT_OZ_PER_BOOK);
}

function flatShippingOption(
  items: BookShippingLine[],
  settings?: ShippingSettings
): ShippingOption | null {
  const rateCents = calculateBookShippingCents(items, settings);
  if (rateCents <= 0) return null;
  return {
    id: "standard",
    carrier: "Standard",
    service: "Economy Shipping",
    rateCents,
    estimatedDays: 5,
  };
}

async function fetchEasyPostRates(
  toAddress: ShippingAddress,
  items: BookShippingLine[]
): Promise<ShippingOption[]> {
  const apiKey = process.env.EASYPOST_API_KEY;
  if (!apiKey) return [];

  const weight = packageWeightOz(items);
  const from = getShipFromAddress();

  const response = await fetch("https://api.easypost.com/v2/shipments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      shipment: {
        to_address: {
          street1: toAddress.line1,
          street2: toAddress.line2 || "",
          city: toAddress.city,
          state: toAddress.state,
          zip: toAddress.postalCode,
          country: toAddress.country || "US",
        },
        from_address: {
          name: from.name,
          street1: from.street1,
          street2: from.street2,
          city: from.city,
          state: from.state,
          zip: from.zip,
          country: from.country,
          phone: from.phone,
        },
        parcel: {
          weight,
          length: DEFAULT_PARCEL.length,
          width: DEFAULT_PARCEL.width,
          height: DEFAULT_PARCEL.height,
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("EasyPost rate error:", response.status, text);
    return [];
  }

  const data = (await response.json()) as {
    rates?: Array<{
      id: string;
      carrier: string;
      service: string;
      rate: string;
      delivery_days: number | null;
    }>;
  };

  if (!data.rates?.length) return [];

  return data.rates
    .map((rate) => ({
      id: rate.id,
      carrier: rate.carrier,
      service: rate.service,
      rateCents: Math.round(parseFloat(rate.rate) * 100),
      estimatedDays: rate.delivery_days,
    }))
    .filter((rate) => rate.rateCents > 0)
    .sort((a, b) => a.rateCents - b.rateCents);
}

export function resolveShippingSettings(settings?: {
  shippingFlatCents?: number;
  freeShippingThresholdCents?: number;
}): ShippingSettings {
  return {
    flatCents:
      settings?.shippingFlatCents && settings.shippingFlatCents > 0
        ? settings.shippingFlatCents
        : BOOK_FLAT_SHIPPING_CENTS,
    freeThresholdCents:
      settings?.freeShippingThresholdCents && settings.freeShippingThresholdCents > 0
        ? settings.freeShippingThresholdCents
        : BOOK_FREE_SHIPPING_THRESHOLD_CENTS,
  };
}

export async function getShippingOptions(
  items: BookShippingLine[],
  toAddress?: ShippingAddress,
  settings?: ShippingSettings
): Promise<ShippingOption[]> {
  const needsShipping = items.some(
    (item) => !item.isDigital && item.priceCents > 0
  );
  if (!needsShipping) return [];

  if (toAddress?.state && toAddress?.postalCode && process.env.EASYPOST_API_KEY) {
    try {
      const liveRates = await fetchEasyPostRates(toAddress, items);
      if (liveRates.length > 0) return liveRates;
    } catch (error) {
      console.error("EasyPost shipping rates failed:", error);
    }
  }

  const flat = flatShippingOption(items, settings);
  return flat ? [flat] : [];
}

export function findShippingOption(
  options: ShippingOption[],
  optionId?: string
): ShippingOption | null {
  if (options.length === 0) return null;
  if (!optionId) return options[0];
  return options.find((option) => option.id === optionId) ?? options[0];
}

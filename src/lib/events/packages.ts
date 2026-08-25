import { dollarsToCents } from "@/lib/utils";

export type EventPackageItemType = "package" | "addon";

export interface EventPackage {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  priceAmount: number;
  itemType: EventPackageItemType;
  enabled: boolean;
  sortOrder: number;
}

export interface EventRegistrationLineItem {
  packageId: string;
  name: string;
  priceAmount: number;
  quantity: number;
  imageUrl?: string;
  itemType?: EventPackageItemType;
}

export function normalizeEventPackages(raw: unknown): EventPackage[] {
  if (!Array.isArray(raw)) return [];
  const result: EventPackage[] = [];
  raw.forEach((item, index) => {
    const row = item as Record<string, unknown>;
    const id = String(row.id ?? "").trim();
    const name = String(row.name ?? "").trim();
    if (!id || !name) return;
    result.push({
      id,
      name,
      description: row.description ? String(row.description) : undefined,
      imageUrl: row.imageUrl ? String(row.imageUrl) : undefined,
      priceAmount: Number(row.priceAmount ?? 0),
      itemType: row.itemType === "addon" ? "addon" : "package",
      enabled: row.enabled !== false,
      sortOrder: Number(row.sortOrder ?? index),
    });
  });
  return result.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function eventHasPackages(event: { packages?: EventPackage[] | unknown }): boolean {
  return getEnabledEventPackages(event).length > 0;
}

export function getEnabledEventPackages(event: { packages?: EventPackage[] | unknown }): EventPackage[] {
  return normalizeEventPackages(event.packages).filter((pkg) => pkg.enabled);
}

export function getEventPackageById(
  event: { packages?: EventPackage[] | unknown },
  packageId: string
): EventPackage | undefined {
  return getEnabledEventPackages(event).find((pkg) => pkg.id === packageId);
}

export function getPackagePriceCents(pkg: Pick<EventPackage, "priceAmount">): number {
  return dollarsToCents(pkg.priceAmount);
}

export function getLineItemsTotalCents(
  items: Array<{ priceAmount: number; quantity: number }>
): number {
  return items.reduce(
    (sum, item) => sum + dollarsToCents(item.priceAmount) * item.quantity,
    0
  );
}

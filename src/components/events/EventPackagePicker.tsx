"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Check } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { Button } from "@/components/ui/Button";
import { formatCents } from "@/lib/utils";
import { resolveImageUrl } from "@/lib/images/resolve";
import type { PublicEvent, PublicEventPackage } from "@/types/public";

interface EventPackagePickerProps {
  event: PublicEvent;
}

export function EventPackagePicker({ event }: EventPackagePickerProps) {
  const { addItem } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);

  const packages = event.packages ?? [];
  const packageItems = packages.filter((pkg) => pkg.itemType === "package");
  const addonItems = packages.filter((pkg) => pkg.itemType === "addon");

  function handleAdd(pkg: PublicEventPackage) {
    addItem({
      type: "event_package",
      eventId: event._id,
      eventSlug: event.slug,
      eventTitle: event.title,
      packageId: pkg.id,
      title: pkg.name,
      imageUrl: pkg.imageUrl,
      itemType: pkg.itemType,
      priceCents: pkg.priceCents,
      quantity: 1,
    });
    setAddedId(pkg.id);
    setTimeout(() => setAddedId(null), 2000);
  }

  if (packages.length === 0) return null;

  return (
    <div className="space-y-8">
      {packageItems.length > 0 && (
        <PackageGroup
          title="Packages"
          items={packageItems}
          addedId={addedId}
          onAdd={handleAdd}
        />
      )}
      {addonItems.length > 0 && (
        <PackageGroup
          title="Add-ons"
          items={addonItems}
          addedId={addedId}
          onAdd={handleAdd}
        />
      )}
      <Button href="/cart" variant="secondary" className="w-full">
        View Cart &amp; Checkout
      </Button>
    </div>
  );
}

function PackageGroup({
  title,
  items,
  addedId,
  onAdd,
}: {
  title: string;
  items: PublicEventPackage[];
  addedId: string | null;
  onAdd: (pkg: PublicEventPackage) => void;
}) {
  return (
    <div>
      <h3 className="font-display text-lg font-bold text-explore-charcoal">{title}</h3>
      <div className="mt-4 space-y-4">
        {items.map((pkg) => (
          <article
            key={pkg.id}
            className="flex gap-4 rounded-2xl border border-explore-charcoal/10 bg-white p-4 shadow-sm"
          >
            <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-explore-sand">
              {pkg.imageUrl ? (
                <Image
                  src={resolveImageUrl(pkg.imageUrl)}
                  alt={pkg.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-explore-charcoal/40">
                  No image
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-explore-charcoal">{pkg.name}</h4>
                  {pkg.description && (
                    <p className="mt-1 text-sm text-explore-charcoal/70">{pkg.description}</p>
                  )}
                </div>
                <p className="shrink-0 font-display text-lg font-bold text-explore-teal">
                  {pkg.priceCents === 0 ? "Free" : formatCents(pkg.priceCents)}
                </p>
              </div>
              <Button
                onClick={() => onAdd(pkg)}
                size="md"
                className="mt-3"
                variant={addedId === pkg.id ? "secondary" : "primary"}
              >
                {addedId === pkg.id ? (
                  <>
                    <Check className="h-4 w-4" />
                    Added
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add to Cart
                  </>
                )}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

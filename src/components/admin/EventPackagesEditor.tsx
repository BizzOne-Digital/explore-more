"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import type { EventPackage, EventPackageItemType } from "@/lib/events/packages";

interface EventPackagesEditorProps {
  value: EventPackage[];
  onChange: (packages: EventPackage[]) => void;
}

function createPackage(sortOrder: number): EventPackage {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    imageUrl: "",
    priceAmount: 0,
    itemType: "package",
    enabled: true,
    sortOrder,
  };
}

export function EventPackagesEditor({ value, onChange }: EventPackagesEditorProps) {
  const [error, setError] = useState<string | null>(null);

  function updatePackage(index: number, patch: Partial<EventPackage>) {
    onChange(value.map((pkg, i) => (i === index ? { ...pkg, ...patch } : pkg)));
  }

  function removePackage(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function addPackage(itemType: EventPackageItemType) {
    onChange([...value, createPackage(value.length)]);
    if (itemType === "addon") {
      updatePackage(value.length, { itemType: "addon" });
    }
  }

  return (
    <div className="space-y-4 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Packages &amp; Add-ons</h3>
          <p className="mt-1 text-xs text-white/50">
            Offer picture-day packages, add-ons, and optional images. Customers can add multiple to cart.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => addPackage("package")}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Package
          </button>
          <button
            type="button"
            onClick={() => {
              const next = createPackage(value.length);
              onChange([...value, { ...next, itemType: "addon" }]);
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Add-on
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {value.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-white/50">
          No packages yet. Add packages or add-ons for events like picture day.
        </div>
      ) : (
        <div className="space-y-4">
          {value.map((pkg, index) => (
            <div
              key={pkg.id}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/60">
                  <GripVertical className="h-4 w-4" />
                  {pkg.itemType === "addon" ? "Add-on" : "Package"} #{index + 1}
                </div>
                <button
                  type="button"
                  onClick={() => removePackage(index)}
                  className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10"
                  aria-label="Remove package"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-xs font-medium uppercase text-white/50">Name</span>
                  <input
                    value={pkg.name}
                    onChange={(e) => updatePackage(index, { name: e.target.value })}
                    placeholder="Basic Package"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-xs font-medium uppercase text-white/50">Description</span>
                  <textarea
                    value={pkg.description ?? ""}
                    onChange={(e) => updatePackage(index, { description: e.target.value })}
                    rows={2}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    placeholder="Includes 5 digital photos..."
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium uppercase text-white/50">Price (USD)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pkg.priceAmount}
                    onChange={(e) =>
                      updatePackage(index, { priceAmount: Number(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium uppercase text-white/50">Type</span>
                  <select
                    value={pkg.itemType}
                    onChange={(e) =>
                      updatePackage(index, {
                        itemType: e.target.value as EventPackageItemType,
                      })
                    }
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  >
                    <option value="package">Package</option>
                    <option value="addon">Add-on</option>
                  </select>
                </label>
                <div className="sm:col-span-2">
                  <ImageUpload
                    label="Package image (optional)"
                    value={pkg.imageUrl ?? ""}
                    onChange={(url) => updatePackage(index, { imageUrl: url })}
                    folder="events"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={pkg.enabled}
                    onChange={(e) => updatePackage(index, { enabled: e.target.checked })}
                    className="rounded border-white/20"
                  />
                  Enabled on website
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          const invalid = value.find((pkg) => !pkg.name.trim());
          if (invalid) {
            setError("Each package needs a name before saving.");
            return;
          }
          setError(null);
        }}
        className="hidden"
      />
    </div>
  );
}

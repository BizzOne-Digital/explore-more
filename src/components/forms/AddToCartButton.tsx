"use client";

import { useState } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { ShoppingCart } from "lucide-react";

interface AddToCartButtonProps {
  book: {
    _id: string;
    slug: string;
    title: string;
    coverImage?: string;
    priceCents: number;
    salePriceCents?: number;
    stockStatus?: string;
  };
  variant?: "default" | "storefront";
  className?: string;
}

export function AddToCartButton({ book, variant = "default", className }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const outOfStock = book.stockStatus === "out_of_stock";
  const price = book.salePriceCents ?? book.priceCents;

  function handleAdd() {
    addItem({
      bookId: book._id,
      slug: book.slug,
      title: book.title,
      coverImage: book.coverImage,
      priceCents: price,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <Button
      onClick={handleAdd}
      disabled={outOfStock}
      variant={added ? "secondary" : "primary"}
      size={variant === "storefront" ? "md" : "lg"}
      className={cn(
        variant === "storefront" &&
          "w-full rounded-lg bg-[#1a73e8] uppercase tracking-wide shadow-none hover:bg-[#1558b0]",
        variant !== "storefront" && "w-full sm:w-auto",
        className
      )}
    >
      {variant !== "storefront" && <ShoppingCart className="h-4 w-4" />}
      {outOfStock ? "Out of Stock" : added ? "Added!" : variant === "storefront" ? "ADD TO CART" : "Add to Cart"}
    </Button>
  );
}

"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { CartItem } from "@/types";
import { getCartItemKey, normalizeCartItem, type AddCartItemInput } from "@/lib/cart/items";

interface CartContextType {
  items: CartItem[];
  addItem: (item: AddCartItemInput) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  clearEventPackages: (eventId?: string) => void;
  itemCount: number;
  subtotalCents: number;
}

const CartContext = createContext<CartContextType | null>(null);
const CART_KEY = "ema-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = localStorage.getItem(CART_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as CartItem[];
          setItems(parsed.map((item) => normalizeCartItem(item)));
        }
      } catch {
        /* ignore */
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    }
  }, [items, loaded]);

  const addItem = useCallback((item: AddCartItemInput) => {
    const normalized = normalizeCartItem({ ...item, quantity: item.quantity || 1 } as CartItem);
    const key = getCartItemKey(normalized);
    setItems((prev) => {
      const base =
        normalized.type === "event_package"
          ? prev.filter(
              (i) => i.type !== "event_package" || i.eventId === normalized.eventId
            )
          : prev;
      const existing = base.find((i) => getCartItemKey(i) === key);
      if (existing) {
        return base.map((i) =>
          getCartItemKey(i) === key
            ? { ...i, quantity: i.quantity + (item.quantity || 1) }
            : i
        );
      }
      return [...base, { ...normalized, quantity: item.quantity || 1 }];
    });
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => getCartItemKey(i) !== key));
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => getCartItemKey(i) !== key));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (getCartItemKey(i) === key ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const clearEventPackages = useCallback((eventId?: string) => {
    setItems((prev) =>
      prev.filter((item) => {
        if (item.type !== "event_package") return true;
        if (!eventId) return false;
        return item.eventId !== eventId;
      })
    );
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotalCents = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        clearEventPackages,
        itemCount,
        subtotalCents,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

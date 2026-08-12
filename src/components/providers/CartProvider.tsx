"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { CartItem } from "@/types";

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (bookId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
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
        if (stored) setItems(JSON.parse(stored));
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

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.bookId === item.bookId);
        if (existing) {
          return prev.map((i) =>
            i.bookId === item.bookId
              ? { ...i, quantity: i.quantity + (item.quantity || 1) }
              : i
          );
        }
        return [...prev, { ...item, quantity: item.quantity || 1 }];
      });
    },
    []
  );

  const removeItem = useCallback((bookId: string) => {
    setItems((prev) => prev.filter((i) => i.bookId !== bookId));
  }, []);

  const updateQuantity = useCallback((bookId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.bookId !== bookId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.bookId === bookId ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotalCents = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotalCents }}
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

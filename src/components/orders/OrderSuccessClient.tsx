"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DownloadButton } from "@/components/books/DownloadButton";
import { useCart } from "@/components/providers/CartProvider";
import { formatCents } from "@/lib/utils";

interface DigitalDownload {
  bookId: string;
  orderId: string;
  title: string;
  fileName: string;
  fileType: string;
}

interface OrderConfirmation {
  orderNumber: string;
  orderId: string;
  paymentStatus: string;
  customerName: string;
  customerEmail: string;
  totalCents: number;
  items: Array<{ title: string; quantity: number; priceCents: number }>;
  digitalDownloads: DigitalDownload[];
}

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 15;

export function OrderSuccessClient() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCart();

  const [order, setOrder] = useState<OrderConfirmation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderNumber && !sessionId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let pollCount = 0;

    async function loadOrder() {
      const params = new URLSearchParams();
      if (orderNumber) params.set("order", orderNumber);
      if (sessionId) params.set("session_id", sessionId);

      const res = await fetch(`/api/orders/confirmation?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Could not load order");
      }

      return json as OrderConfirmation;
    }

    void (async () => {
      try {
        while (!cancelled && pollCount < MAX_POLLS) {
          const data = await loadOrder();
          if (cancelled) return;

          if (data.paymentStatus === "paid" || data.paymentStatus === "manual") {
            setOrder(data);
            clearCart();
            setLoading(false);
            return;
          }

          pollCount += 1;
          if (pollCount >= MAX_POLLS) {
            setOrder(data);
            setLoading(false);
            return;
          }

          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderNumber, sessionId, clearCart]);

  const hasDigital = (order?.digitalDownloads.length ?? 0) > 0;
  const isPaid = order?.paymentStatus === "paid" || order?.paymentStatus === "manual";

  return (
    <section className="flex min-h-[70vh] w-full items-center justify-center overflow-x-clip bg-explore-cream pt-28 pb-16">
      <div className="w-full min-w-0 max-w-lg px-3 sm:px-4">
        {loading ? (
          <div className="space-y-3 text-center">
            <Loader className="mx-auto h-10 w-10 animate-spin text-explore-teal" />
            <p className="text-sm text-explore-charcoal/70">Confirming your payment…</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-explore-charcoal/10 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-explore-forest/15">
              <CheckCircle className="h-10 w-10 text-explore-forest" />
            </div>

            <h1 className="font-display text-3xl font-bold text-explore-charcoal">
              Thank you for your purchase!
            </h1>

            <p className="mt-3 text-explore-charcoal/70">
              {order
                ? `Order #${order.orderNumber} is confirmed. A receipt has been sent to ${order.customerEmail}.`
                : orderNumber
                  ? `Your order #${orderNumber} was received. You'll receive an email shortly.`
                  : "Your order was received. You'll receive an email shortly."}
            </p>

            {error && <p className="mt-3 text-sm text-amber-700">{error}</p>}

            {!isPaid && order && (
              <p className="mt-3 text-sm text-amber-700">
                Payment is still processing. Refresh this page in a moment or check your email.
              </p>
            )}

            {order && isPaid && (
              <p className="mt-2 text-sm font-medium text-explore-charcoal">
                Total paid: {formatCents(order.totalCents)}
              </p>
            )}

            {hasDigital && isPaid && (
              <div className="mt-8 rounded-xl border border-explore-teal/20 bg-explore-teal/5 p-5 text-left">
                <h2 className="font-display text-lg font-semibold text-explore-charcoal">
                  Download your books
                </h2>
                <p className="mt-1 text-sm text-explore-charcoal/70">
                  Click the button below to download each digital book you purchased.
                </p>
                <div className="mt-4 space-y-3">
                  {order!.digitalDownloads.map((item) => (
                    <div
                      key={item.bookId}
                      className="rounded-lg border border-explore-charcoal/10 bg-white p-4"
                    >
                      <p className="mb-3 text-sm font-medium text-explore-charcoal">
                        {item.title}
                      </p>
                      <DownloadButton
                        bookId={item.bookId}
                        orderId={item.orderId}
                        fileName={item.fileName}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button href="/books" variant="secondary">
                Continue Shopping
              </Button>
              <Button href="/" variant="outline">
                Back to Home
              </Button>
            </div>

            {order && (
              <p className="mt-6 text-xs text-explore-charcoal/50">
                Need help?{" "}
                <Link href="/contact" className="text-explore-teal hover:underline">
                  Contact us
                </Link>
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

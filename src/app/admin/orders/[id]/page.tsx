import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Package } from "lucide-react";
import connectDB from "@/lib/db";
import { Order } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { isValidObjectId } from "@/lib/admin/api";
import { formatDateTime, serialize } from "@/lib/admin/serialize";
import { formatCents } from "@/lib/utils";

type SerializedOrder = {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  paymentStatus: string;
  items: { title: string; quantity: number; priceCents: number }[];
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  donationCents?: number;
  totalCents: number;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  shippingAddress?: {
    name?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  createdAt: string;
  updatedAt: string;
};

async function getOrder(id: string): Promise<SerializedOrder | null> {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  const item = await Order.findById(id).lean();
  if (!item) return null;
  return serialize(item) as unknown as SerializedOrder;
}

function formatShippingAddress(addr: SerializedOrder["shippingAddress"]): string[] {
  if (!addr) return ["—"];
  const lines: string[] = [];
  if (addr.name) lines.push(addr.name);
  if (addr.line1) lines.push(addr.line1);
  if (addr.line2) lines.push(addr.line2);
  const cityLine = [addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ");
  if (cityLine) lines.push(cityLine);
  if (addr.country && addr.country !== "US") lines.push(addr.country);
  return lines.length ? lines : ["—"];
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const addressLines = formatShippingAddress(order.shippingAddress);

  return (
    <div>
      <Link
        href="/admin/orders"
        className="mb-4 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-explore-lime"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Link>

      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`Placed ${formatDateTime(order.createdAt)}`}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <StatusBadge status={order.paymentStatus} />
        <span className="text-sm text-white/50">Updated {formatDateTime(order.updatedAt)}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
            <Mail className="h-5 w-5 text-explore-lime" />
            Customer
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-white/50">Name</dt>
              <dd className="font-medium text-white">{order.customerName}</dd>
            </div>
            <div>
              <dt className="text-white/50">Email</dt>
              <dd>
                <a
                  href={`mailto:${order.customerEmail}`}
                  className="font-medium text-explore-lime hover:underline"
                >
                  {order.customerEmail}
                </a>
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
            <MapPin className="h-5 w-5 text-explore-lime" />
            Shipping address
          </h2>
          <address className="mt-4 space-y-0.5 text-sm not-italic text-white/90">
            {addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </address>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
          <Package className="h-5 w-5 text-explore-lime" />
          Items
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/50">
                <th className="pb-3 pr-4 font-medium">Book</th>
                <th className="pb-3 pr-4 font-medium">Qty</th>
                <th className="pb-3 pr-4 font-medium">Unit price</th>
                <th className="pb-3 font-medium text-right">Line total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={`${item.title}-${index}`} className="border-b border-white/5 text-white/90">
                  <td className="py-3 pr-4">{item.title}</td>
                  <td className="py-3 pr-4">{item.quantity}</td>
                  <td className="py-3 pr-4">{formatCents(item.priceCents)}</td>
                  <td className="py-3 text-right">{formatCents(item.priceCents * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="mt-6 ml-auto max-w-xs space-y-2 border-t border-white/10 pt-4 text-sm">
          <div className="flex justify-between text-white/70">
            <dt>Subtotal</dt>
            <dd>{formatCents(order.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between text-white/70">
            <dt>Tax</dt>
            <dd>{formatCents(order.taxCents)}</dd>
          </div>
          <div className="flex justify-between text-white/70">
            <dt>Shipping</dt>
            <dd>{formatCents(order.shippingCents)}</dd>
          </div>
          {(order.donationCents ?? 0) > 0 && (
            <div className="flex justify-between text-white/70">
              <dt>Donation</dt>
              <dd>{formatCents(order.donationCents ?? 0)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-white/10 pt-2 text-base font-semibold text-white">
            <dt>Total</dt>
            <dd>{formatCents(order.totalCents)}</dd>
          </div>
        </dl>
      </section>

      {(order.stripeSessionId || order.stripePaymentIntentId) && (
        <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
          <h2 className="font-medium text-white/80">Payment references</h2>
          {order.stripeSessionId && (
            <p className="mt-2 break-all">
              Stripe session: <span className="font-mono text-white/70">{order.stripeSessionId}</span>
            </p>
          )}
          {order.stripePaymentIntentId && (
            <p className="mt-1 break-all">
              Payment intent:{" "}
              <span className="font-mono text-white/70">{order.stripePaymentIntentId}</span>
            </p>
          )}
        </section>
      )}
    </div>
  );
}

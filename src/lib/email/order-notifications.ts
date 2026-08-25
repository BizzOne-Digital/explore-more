import { sendTransactionalEmail, wrapEmailTemplate } from "@/lib/services/email";
import { formatCents } from "@/lib/utils";
import { getAdminEmail, getPublicContactEmail } from "@/lib/email/get-admin-email";
import type { DigitalDownloadItem } from "@/lib/orders/digital-downloads";

export interface OrderEmailData {
  orderNumber: string;
  orderId?: string;
  customerName: string;
  customerEmail: string;
  totalCents: number;
  subtotalCents: number;
  shippingCents: number;
  items: Array<{ title: string; quantity: number; priceCents: number }>;
  shippingAddress?: {
    name?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  digitalDownloads?: DigitalDownloadItem[];
  downloadPageUrl?: string;
}

function formatAddress(address?: OrderEmailData["shippingAddress"]): string {
  if (!address) return "Not provided";
  const lines = [
    address.name,
    address.line1,
    address.line2,
    [address.city, address.state, address.postalCode].filter(Boolean).join(", "),
    address.country,
  ].filter(Boolean);
  return lines.join("<br>");
}

function buildItemsHtml(items: OrderEmailData["items"]): string {
  if (items.length === 0) return "<p>No items listed.</p>";
  const rows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee">${item.title}</td>
          <td style="padding:8px 8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${formatCents(item.priceCents * item.quantity)}</td>
        </tr>`
    )
    .join("");
  return `
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead>
        <tr style="color:#666;font-size:12px;text-transform:uppercase">
          <th style="text-align:left;padding-bottom:8px">Item</th>
          <th style="text-align:center;padding-bottom:8px">Qty</th>
          <th style="text-align:right;padding-bottom:8px">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function buildDigitalDownloadsHtml(
  downloads: DigitalDownloadItem[],
  downloadPageUrl: string
): string {
  if (downloads.length === 0) return "";

  const rows = downloads
    .map(
      (item) =>
        `<li style="margin-bottom:8px"><strong>${item.title}</strong> (${item.fileName})</li>`
    )
    .join("");

  return `
    <div style="background:#e8f7f8;padding:16px;border-radius:8px;margin:24px 0;border:1px solid #b8e6ea">
      <h3 style="color:#101315;font-size:16px;margin:0 0 12px">Your digital downloads</h3>
      <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;color:#444">${rows}</ul>
      <a href="${downloadPageUrl}" style="display:inline-block;background:#0c8991;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Download your books</a>
    </div>
  `;
}

export async function sendBookOrderEmails(order: OrderEmailData): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.exploremoreacademy.com";
  const itemsHtml = buildItemsHtml(order.items);
  const shippingHtml = formatAddress(order.shippingAddress);
  const digitalDownloads = order.digitalDownloads ?? [];
  const downloadPageUrl =
    order.downloadPageUrl || `${appUrl}/order-success?order=${order.orderNumber}`;
  const digitalHtml = buildDigitalDownloadsHtml(digitalDownloads, downloadPageUrl);
  const hasDigital = digitalDownloads.length > 0;

  const customerFollowUp = hasDigital
    ? `<p style="margin-top:24px;font-size:14px;color:#666">Your digital books are ready to download. Use the button above anytime. Questions? Reply to this email or contact us at ${getPublicContactEmail()}.</p>`
    : `<p style="margin-top:24px;font-size:14px;color:#666">We'll notify you when your order ships. Questions? Reply to this email or contact us at ${getPublicContactEmail()}.</p>`;

  await sendTransactionalEmail({
    to: order.customerEmail,
    subject: `Thank you for your purchase — ${order.orderNumber}`,
    template: "orderConfirmation",
    htmlBody: wrapEmailTemplate(`
      <h2 style="color:#101315">Thank you for your purchase!</h2>
      <p>Hi ${order.customerName}, we've received your payment and your order is confirmed.</p>
      <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:20px 0">
        <p style="margin:0 0 8px"><strong>Order #:</strong> ${order.orderNumber}</p>
        <p style="margin:0 0 8px"><strong>Subtotal:</strong> ${formatCents(order.subtotalCents)}</p>
        <p style="margin:0 0 8px"><strong>Shipping:</strong> ${order.shippingCents === 0 ? "Free" : formatCents(order.shippingCents)}</p>
        <p style="margin:0"><strong>Total paid:</strong> ${formatCents(order.totalCents)}</p>
      </div>
      <h3 style="color:#101315;font-size:16px">Items</h3>
      ${itemsHtml}
      ${digitalHtml}
      ${hasDigital ? "" : `<h3 style="color:#101315;font-size:16px;margin-top:24px">Shipping address</h3><p style="font-size:14px;color:#444">${shippingHtml}</p>`}
      ${customerFollowUp}
      <p style="margin-top:16px"><a href="${downloadPageUrl}" style="color:#0c8991;font-weight:600">View your order</a></p>
    `),
    textBody: `Thank you for your purchase ${order.orderNumber}. Total: ${formatCents(order.totalCents)}.${hasDigital ? ` Download your books: ${downloadPageUrl}` : ""}`,
  });

  const adminDigitalNote =
    digitalDownloads.length > 0
      ? `<p style="margin:12px 0 0;font-size:14px;color:#444"><strong>Digital downloads:</strong> ${digitalDownloads.map((d) => d.title).join(", ")}</p>`
      : "";

  await sendTransactionalEmail({
    to: getAdminEmail(),
    subject: `New Book Order — ${order.orderNumber}`,
    template: "adminOrderNotification",
    htmlBody: wrapEmailTemplate(`
      <h2 style="color:#101315">New book order received</h2>
      <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0">
        <p style="margin:0 0 6px"><strong>Order #:</strong> ${order.orderNumber}</p>
        <p style="margin:0 0 6px"><strong>Customer:</strong> ${order.customerName}</p>
        <p style="margin:0 0 6px"><strong>Email:</strong> <a href="mailto:${order.customerEmail}">${order.customerEmail}</a></p>
        <p style="margin:0"><strong>Total:</strong> ${formatCents(order.totalCents)}</p>
        ${adminDigitalNote}
      </div>
      <h3 style="font-size:16px;color:#101315">Items ordered</h3>
      ${itemsHtml}
      <h3 style="font-size:16px;color:#101315;margin-top:20px">Ship to</h3>
      <p style="font-size:14px;color:#444">${shippingHtml}</p>
      <p style="margin-top:20px"><a href="${appUrl}/admin/orders" style="display:inline-block;background:#0c8991;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Open Admin Orders</a></p>
    `),
    textBody: `New book order ${order.orderNumber} from ${order.customerName} (${order.customerEmail}). Total ${formatCents(order.totalCents)}.`,
  });
}

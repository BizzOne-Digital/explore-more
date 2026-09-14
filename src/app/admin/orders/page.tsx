import connectDB from "@/lib/db";
import { Order } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { OrdersAdminTable, type OrderRow } from "@/components/admin/OrdersAdminTable";
import { serialize } from "@/lib/admin/serialize";

async function getData() {
  await connectDB();
  const items = await Order.find().sort({ createdAt: -1 }).lean();
  return serialize(items) as unknown as OrderRow[];
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const data = await getData();

  return (
    <div>
      <PageHeader title="Orders" description="Bookstore orders — search by customer email when they call in" />
      <OrdersAdminTable orders={data} initialSearch={search} />
    </div>
  );
}

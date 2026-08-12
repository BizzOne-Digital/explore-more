import connectDB from "@/lib/db";
import {
  User,
  Event,
  EventRegistration,
  Book,
  Order,
  Course,
  Enrollment,
  Program,
  ServiceRequest,
  DonationCampaign,
  Donation,
  ContactMessage,
  NewsletterSubscriber,
} from "@/models";
import { StatCard } from "@/components/admin/StatCard";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize, formatDateTime } from "@/lib/admin/serialize";
import { formatCents } from "@/lib/utils";
import {
  Users,
  Calendar,
  GraduationCap,
  DollarSign,
  BookOpen,
  Inbox,
} from "lucide-react";
import Link from "next/link";

async function getDashboardStats() {
  await connectDB();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalStudents,
    totalEvents,
    upcomingEvents,
    totalCourses,
    activeEnrollments,
    totalOrders,
    recentOrders,
    totalDonations,
    donationTotal,
    newServiceRequests,
    unreadMessages,
    subscribers,
    recentRegistrations,
  ] = await Promise.all([
    User.countDocuments({ role: "student", isActive: true }),
    Event.countDocuments(),
    Event.countDocuments({ status: "published", startDate: { $gte: new Date() } }),
    Course.countDocuments({ status: "published" }),
    Enrollment.countDocuments({ status: "active" }),
    Order.countDocuments(),
    Order.find().sort({ createdAt: -1 }).limit(5).lean(),
    Donation.countDocuments({ paymentStatus: "paid" }),
    Donation.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$amountCents" } } },
    ]),
    ServiceRequest.countDocuments({ status: "new" }),
    ContactMessage.countDocuments({ status: "new" }),
    NewsletterSubscriber.countDocuments({ unsubscribed: false, verified: true }),
    EventRegistration.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("eventId", "title")
      .lean(),
  ]);

  const raisedCents = donationTotal[0]?.total ?? 0;

  return serialize({
    stats: {
      totalStudents,
      totalEvents,
      upcomingEvents,
      totalCourses,
      activeEnrollments,
      totalOrders,
      totalDonations,
      raisedCents,
      newServiceRequests,
      unreadMessages,
      subscribers,
    },
    recentOrders,
    recentRegistrations,
  });
}

export default async function AdminDashboardPage() {
  const { stats, recentOrders, recentRegistrations } = await getDashboardStats();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of Explore More Academy"
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Active Students" value={stats.totalStudents} icon={Users} accent="teal" />
        <StatCard
          label="Upcoming Events"
          value={stats.upcomingEvents}
          icon={Calendar}
          trend={`${stats.totalEvents} total events`}
          accent="lime"
        />
        <StatCard
          label="Active Enrollments"
          value={stats.activeEnrollments}
          icon={GraduationCap}
          trend={`${stats.totalCourses} published courses`}
          accent="teal"
        />
        <StatCard
          label="Book Orders"
          value={stats.totalOrders}
          icon={BookOpen}
          accent="orange"
        />
        <StatCard
          label="Donations Raised"
          value={formatCents(stats.raisedCents)}
          icon={DollarSign}
          trend={`${stats.totalDonations} donations`}
          accent="lime"
        />
        <StatCard
          label="Pending Requests"
          value={stats.newServiceRequests}
          icon={Inbox}
          trend={`${stats.unreadMessages} unread messages`}
          accent="orange"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-explore-lime hover:underline">
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-white/40">No orders yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentOrders.map((order) => (
                <li
                  key={String(order._id)}
                  className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{order.orderNumber}</p>
                    <p className="text-xs text-white/40">{order.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white">{formatCents(order.totalCents)}</p>
                    <StatusBadge status={order.paymentStatus} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">Recent Registrations</h2>
            <Link
              href="/admin/event-registrations"
              className="text-xs text-explore-lime hover:underline"
            >
              View all
            </Link>
          </div>
          {recentRegistrations.length === 0 ? (
            <p className="text-sm text-white/40">No registrations yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentRegistrations.map((reg) => (
                <li
                  key={String(reg._id)}
                  className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{reg.studentName}</p>
                    <p className="text-xs text-white/40">
                      {(reg.eventId as { title?: string })?.title ?? "Event"}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={reg.paymentStatus} />
                    <p className="mt-1 text-xs text-white/40">
                      {formatDateTime(reg.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

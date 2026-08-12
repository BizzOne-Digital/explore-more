import fs from "fs";
import path from "path";

const root = path.join(process.cwd(), "src");

function write(filePath, content) {
  const full = path.join(root, filePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  return filePath;
}

const created = [];

// Generic list API route
function listRoute(resource, modelImport, modelName, sort = "{ createdAt: -1 }") {
  return `import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { ${modelName} } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";

export async function GET() {
  try {
    await connectDB();
    const items = await ${modelName}.find().sort(${sort}).lean();
    return apiSuccess(items);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const item = await ${modelName}.create(body);
    return apiSuccess(item, 201);
  } catch (error) {
    return apiError(error);
  }
}
`;
}

function idRoute(modelName) {
  return `import connectDB from "@/lib/db";
import { ${modelName} } from "@/models";
import { apiSuccess, apiError, notFound, isValidObjectId } from "@/lib/admin/api";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return notFound();
    await connectDB();
    const item = await ${modelName}.findById(id).lean();
    if (!item) return notFound();
    return apiSuccess(item);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return notFound();
    await connectDB();
    const body = await request.json();
    const item = await ${modelName}.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
    if (!item) return notFound();
    return apiSuccess(item);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return notFound();
    await connectDB();
    const item = await ${modelName}.findByIdAndDelete(id);
    if (!item) return notFound();
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
`;
}

function keyRoute(modelName, keyField = "key") {
  return `import connectDB from "@/lib/db";
import { ${modelName} } from "@/models";
import { apiSuccess, apiError, notFound } from "@/lib/admin/api";

export async function GET(_req: Request, { params }: { params: Promise<{ pageKey: string }> }) {
  try {
    const { pageKey } = await params;
    await connectDB();
    const item = await ${modelName}.findOne({ ${keyField}: pageKey }).lean();
    if (!item) return notFound();
    return apiSuccess(item);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ pageKey: string }> }) {
  try {
    const { pageKey } = await params;
    await connectDB();
    const body = await request.json();
    const item = await ${modelName}.findOneAndUpdate(
      { ${keyField}: pageKey },
      body,
      { new: true, runValidators: true, upsert: true }
    ).lean();
    return apiSuccess(item);
  } catch (error) {
    return apiError(error);
  }
}
`;
}

// API routes config
const apiResources = [
  { path: "app/api/admin/events/route.ts", model: "Event" },
  { path: "app/api/admin/events/[id]/route.ts", type: "id", model: "Event" },
  { path: "app/api/admin/event-registrations/route.ts", model: "EventRegistration" },
  { path: "app/api/admin/event-registrations/[id]/route.ts", type: "id", model: "EventRegistration" },
  { path: "app/api/admin/books/route.ts", model: "Book" },
  { path: "app/api/admin/books/[id]/route.ts", type: "id", model: "Book" },
  { path: "app/api/admin/orders/route.ts", model: "Order" },
  { path: "app/api/admin/orders/[id]/route.ts", type: "id", model: "Order" },
  { path: "app/api/admin/courses/route.ts", model: "Course" },
  { path: "app/api/admin/courses/[id]/route.ts", type: "id", model: "Course" },
  { path: "app/api/admin/enrollments/route.ts", model: "Enrollment" },
  { path: "app/api/admin/enrollments/[id]/route.ts", type: "id", model: "Enrollment" },
  { path: "app/api/admin/programs/route.ts", model: "Program", sort: "{ listingOrder: 1 }" },
  { path: "app/api/admin/programs/[id]/route.ts", type: "id", model: "Program" },
  { path: "app/api/admin/service-requests/route.ts", model: "ServiceRequest" },
  { path: "app/api/admin/service-requests/[id]/route.ts", type: "id", model: "ServiceRequest" },
  { path: "app/api/admin/campaigns/route.ts", model: "DonationCampaign" },
  { path: "app/api/admin/campaigns/[id]/route.ts", type: "id", model: "DonationCampaign" },
  { path: "app/api/admin/donations/route.ts", model: "Donation" },
  { path: "app/api/admin/donations/[id]/route.ts", type: "id", model: "Donation" },
  { path: "app/api/admin/students/route.ts", model: "User" },
  { path: "app/api/admin/students/[id]/route.ts", type: "id", model: "User" },
  { path: "app/api/admin/results/route.ts", model: "Result" },
  { path: "app/api/admin/results/[id]/route.ts", type: "id", model: "Result" },
  { path: "app/api/admin/attendance/route.ts", model: "Attendance" },
  { path: "app/api/admin/attendance/[id]/route.ts", type: "id", model: "Attendance" },
  { path: "app/api/admin/certificates/route.ts", model: "Certificate" },
  { path: "app/api/admin/certificates/[id]/route.ts", type: "id", model: "Certificate" },
  { path: "app/api/admin/users/route.ts", model: "User" },
  { path: "app/api/admin/users/[id]/route.ts", type: "id", model: "User" },
  { path: "app/api/admin/gallery/route.ts", model: "GalleryImage" },
  { path: "app/api/admin/gallery/[id]/route.ts", type: "id", model: "GalleryImage" },
  { path: "app/api/admin/testimonials/route.ts", model: "Testimonial" },
  { path: "app/api/admin/testimonials/[id]/route.ts", type: "id", model: "Testimonial" },
  { path: "app/api/admin/faqs/route.ts", model: "FAQ", sort: "{ order: 1 }" },
  { path: "app/api/admin/faqs/[id]/route.ts", type: "id", model: "FAQ" },
  { path: "app/api/admin/email-campaigns/route.ts", model: "EmailCampaign" },
  { path: "app/api/admin/email-campaigns/[id]/route.ts", type: "id", model: "EmailCampaign" },
  { path: "app/api/admin/messages/route.ts", model: "Message" },
  { path: "app/api/admin/messages/[id]/route.ts", type: "id", model: "Message" },
  { path: "app/api/admin/subscribers/route.ts", model: "NewsletterSubscriber" },
  { path: "app/api/admin/subscribers/[id]/route.ts", type: "id", model: "NewsletterSubscriber" },
  { path: "app/api/admin/pages/route.ts", model: "Page", sort: "{ key: 1 }" },
  { path: "app/api/admin/pages/[pageKey]/route.ts", type: "key", model: "Page" },
];

for (const r of apiResources) {
  let content;
  if (r.type === "id") content = idRoute(r.model);
  else if (r.type === "key") content = keyRoute(r.model);
  else content = listRoute(r.path, "@/models", r.model, r.sort ?? "{ createdAt: -1 }");
  created.push(write(r.path, content));
}

// Settings API
created.push(write("app/api/admin/settings/route.ts", `import connectDB from "@/lib/db";
import { SiteSettings } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { COMPANY } from "@/lib/constants";

export async function GET() {
  try {
    await connectDB();
    let settings = await SiteSettings.findOne().lean();
    if (!settings) {
      settings = await SiteSettings.create({
        companyName: COMPANY.name,
        email: COMPANY.email,
        phone: COMPANY.phone,
      });
    }
    return apiSuccess(settings);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const settings = await SiteSettings.findOneAndUpdate({}, body, {
      new: true,
      upsert: true,
      runValidators: true,
    }).lean();
    return apiSuccess(settings);
  } catch (error) {
    return apiError(error);
  }
}
`));

// Stats API
created.push(write("app/api/admin/stats/route.ts", `import connectDB from "@/lib/db";
import { User, Event, Order, Donation, ServiceRequest, ContactMessage } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";

export async function GET() {
  try {
    await connectDB();
    const [students, events, orders, donations, requests, messages] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Event.countDocuments({ status: "published" }),
      Order.countDocuments(),
      Donation.countDocuments({ paymentStatus: "paid" }),
      ServiceRequest.countDocuments({ status: "new" }),
      ContactMessage.countDocuments({ status: "new" }),
    ]);
    return apiSuccess({ students, events, orders, donations, requests, messages });
  } catch (error) {
    return apiError(error);
  }
}
`));

// Students API filter
created.push(write("app/api/admin/students/route.ts", `import connectDB from "@/lib/db";
import { User-StudentProfile } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";

export async function GET() {
  try {
    await connectDB();
    const students = await User.find({ role: "student" }).sort({ createdAt: -1 }).lean();
    const profiles = await StudentProfile.find().lean();
    const profileMap = Object.fromEntries(profiles.map((p) => [String(p.userId), p]));
    const items = students.map((s) => ({ ...s, profile: profileMap[String(s._id)] ?? null }));
    return apiSuccess(items);
  } catch (error) {
    return apiError(error);
  }
}
`.replace("User-StudentProfile", "User, StudentProfile")));

// Users list (all roles)
created.push(write("app/api/admin/users/route.ts", `import connectDB from "@/lib/db";
import { User } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { hashPassword } from "@/lib/utils";

export async function GET() {
  try {
    await connectDB();
    const users = await User.find().select("-passwordHash").sort({ createdAt: -1 }).lean();
    return apiSuccess(users);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    if (body.password) {
      body.passwordHash = await hashPassword(body.password);
      delete body.password;
    }
    const user = await User.create(body);
    const result = user.toObject();
    delete result.passwordHash;
    return apiSuccess(result, 201);
  } catch (error) {
    return apiError(error);
  }
}
`));

// List page generator
function listPage({ title, description, modelImports, modelName, query, columns, action, rowHref, emptyMessage }) {
  const colDefs = columns.map(c => `    { key: "${c.key}", header: "${c.header}"${c.render ? `, render: (row) => ${c.render}` : ""} },`).join("\n");
  return `import connectDB from "@/lib/db";
import { ${modelImports} } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize, formatDate${columns.some(c => c.render?.includes("formatCents")) ? ", formatDateTime" : ""} } from "@/lib/admin/serialize";
${columns.some(c => c.render?.includes("formatCents")) ? 'import { formatCents } from "@/lib/utils";\n' : ""}
async function getData() {
  await connectDB();
  const items = await ${modelName}.${query ?? "find().sort({ createdAt: -1 }).lean()"};
  return serialize(items);
}

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="${title}"
        description="${description}"
        ${action ? `action={{ label: "${action.label}", href: "${action.href}" }}` : ""}
      />
      <DataTable
        columns={[
${colDefs}
        ]}
        data={data as Record<string, unknown>[]}
        ${rowHref ? `rowHref={(row) => ${rowHref}}` : ""}
        emptyMessage="${emptyMessage ?? "No records found."}"
      />
    </div>
  );
}
`;
}

const listPages = [
  {
    path: "app/admin/pages/page.tsx",
    title: "Pages", description: "Manage website page content",
    modelImports: "Page", modelName: "Page",
    query: "find().sort({ key: 1 }).lean()",
    columns: [
      { key: "title", header: "Title" },
      { key: "key", header: "Key" },
      { key: "status", header: "Status", render: '<StatusBadge status={String(row.status)} />' },
      { key: "updatedAt", header: "Updated", render: "formatDate(row.updatedAt as string)" },
    ],
    rowHref: '"/admin/pages/" + String(row.key)',
  },
  {
    path: "app/admin/events/page.tsx",
    title: "Events", description: "Manage events and workshops",
    modelImports: "Event", modelName: "Event",
    columns: [
      { key: "title", header: "Title" },
      { key: "startDate", header: "Start", render: "formatDate(row.startDate as string)" },
      { key: "location", header: "Location" },
      { key: "status", header: "Status", render: '<StatusBadge status={String(row.status)} />' },
    ],
    action: { label: "New Event", href: "/admin/events/new" },
    rowHref: '"/admin/events/" + String(row._id)',
  },
  {
    path: "app/admin/event-registrations/page.tsx",
    title: "Event Registrations", description: "View and manage event registrations",
    modelImports: "EventRegistration", modelName: "EventRegistration",
    columns: [
      { key: "studentName", header: "Student" },
      { key: "guardianEmail", header: "Guardian Email" },
      { key: "paymentStatus", header: "Payment", render: '<StatusBadge status={String(row.paymentStatus)} />' },
      { key: "checkedIn", header: "Checked In", render: 'row.checkedIn ? "Yes" : "No"' },
      { key: "createdAt", header: "Registered", render: "formatDate(row.createdAt as string)" },
    ],
  },
  {
    path: "app/admin/books/page.tsx",
    title: "Books", description: "Manage bookstore inventory",
    modelImports: "Book", modelName: "Book",
    columns: [
      { key: "title", header: "Title" },
      { key: "author", header: "Author" },
      { key: "priceCents", header: "Price", render: "formatCents(row.priceCents as number)" },
      { key: "stockStatus", header: "Stock", render: '<StatusBadge status={String(row.stockStatus)} />' },
    ],
    action: { label: "New Book", href: "/admin/books/new" },
    rowHref: '"/admin/books/" + String(row._id)',
  },
  {
    path: "app/admin/orders/page.tsx",
    title: "Orders", description: "Bookstore orders",
    modelImports: "Order", modelName: "Order",
    columns: [
      { key: "orderNumber", header: "Order #" },
      { key: "customerName", header: "Customer" },
      { key: "totalCents", header: "Total", render: "formatCents(row.totalCents as number)" },
      { key: "paymentStatus", header: "Status", render: '<StatusBadge status={String(row.paymentStatus)} />' },
      { key: "createdAt", header: "Date", render: "formatDate(row.createdAt as string)" },
    ],
  },
  {
    path: "app/admin/courses/page.tsx",
    title: "Courses", description: "Manage courses and curriculum",
    modelImports: "Course", modelName: "Course",
    columns: [
      { key: "title", header: "Title" },
      { key: "instructor", header: "Instructor" },
      { key: "priceCents", header: "Price", render: "(row.isFree as boolean) ? \"Free\" : formatCents(row.priceCents as number)" },
      { key: "status", header: "Status", render: '<StatusBadge status={String(row.status)} />' },
    ],
    action: { label: "New Course", href: "/admin/courses/new" },
    rowHref: '"/admin/courses/" + String(row._id)',
  },
  {
    path: "app/admin/enrollments/page.tsx",
    title: "Enrollments", description: "Course enrollments",
    modelImports: "Enrollment", modelName: "Enrollment",
    columns: [
      { key: "courseId", header: "Course ID" },
      { key: "userId", header: "User ID" },
      { key: "progress", header: "Progress", render: 'String(row.progress) + "%"' },
      { key: "status", header: "Status", render: '<StatusBadge status={String(row.status)} />' },
      { key: "enrolledAt", header: "Enrolled", render: "formatDate(row.enrolledAt as string)" },
    ],
  },
  {
    path: "app/admin/programs/page.tsx",
    title: "Programs", description: "Manage adventure programs",
    modelImports: "Program", modelName: "Program",
    query: "find().sort({ listingOrder: 1 }).lean()",
    columns: [
      { key: "title", header: "Title" },
      { key: "tagline", header: "Tagline" },
      { key: "ageRange", header: "Age Range" },
      { key: "status", header: "Status", render: '<StatusBadge status={String(row.status)} />' },
    ],
    action: { label: "New Program", href: "/admin/programs/new" },
    rowHref: '"/admin/programs/" + String(row._id)',
  },
  {
    path: "app/admin/service-requests/page.tsx",
    title: "Service Requests", description: "Program inquiry requests",
    modelImports: "ServiceRequest", modelName: "ServiceRequest",
    columns: [
      { key: "studentName", header: "Student" },
      { key: "parentName", header: "Parent" },
      { key: "email", header: "Email" },
      { key: "status", header: "Status", render: '<StatusBadge status={String(row.status)} />' },
      { key: "createdAt", header: "Submitted", render: "formatDate(row.createdAt as string)" },
    ],
  },
  {
    path: "app/admin/campaigns/page.tsx",
    title: "Donation Campaigns", description: "Manage fundraising campaigns",
    modelImports: "DonationCampaign", modelName: "DonationCampaign",
    columns: [
      { key: "title", header: "Title" },
      { key: "goalCents", header: "Goal", render: "formatCents(row.goalCents as number)" },
      { key: "raisedCents", header: "Raised", render: "formatCents(row.raisedCents as number)" },
      { key: "status", header: "Status", render: '<StatusBadge status={String(row.status)} />' },
    ],
    action: { label: "New Campaign", href: "/admin/campaigns/new" },
    rowHref: '"/admin/campaigns/" + String(row._id)',
  },
  {
    path: "app/admin/donations/page.tsx",
    title: "Donations", description: "Donation records",
    modelImports: "Donation", modelName: "Donation",
    columns: [
      { key: "donorName", header: "Donor" },
      { key: "donorEmail", header: "Email" },
      { key: "amountCents", header: "Amount", render: "formatCents(row.amountCents as number)" },
      { key: "paymentStatus", header: "Status", render: '<StatusBadge status={String(row.paymentStatus)} />' },
      { key: "createdAt", header: "Date", render: "formatDate(row.createdAt as string)" },
    ],
  },
  {
    path: "app/admin/students/page.tsx",
    title: "Students", description: "Student accounts and profiles",
    modelImports: "User", modelName: "User",
    query: 'find({ role: "student" }).sort({ createdAt: -1 }).lean()',
    columns: [
      { key: "name", header: "Name" },
      { key: "email", header: "Email" },
      { key: "emailVerified", header: "Verified", render: 'row.emailVerified ? "Yes" : "No"' },
      { key: "isActive", header: "Active", render: 'row.isActive ? "Yes" : "No"' },
      { key: "createdAt", header: "Joined", render: "formatDate(row.createdAt as string)" },
    ],
    rowHref: '"/admin/students/" + String(row._id)',
  },
  {
    path: "app/admin/results/page.tsx",
    title: "Results", description: "Student assessment results",
    modelImports: "Result", modelName: "Result",
    columns: [
      { key: "subject", header: "Subject" },
      { key: "assessment", header: "Assessment" },
      { key: "grade", header: "Grade" },
      { key: "publishedToStudent", header: "Published", render: 'row.publishedToStudent ? "Yes" : "No"' },
      { key: "date", header: "Date", render: "formatDate(row.date as string)" },
    ],
  },
  {
    path: "app/admin/attendance/page.tsx",
    title: "Attendance", description: "Attendance records",
    modelImports: "Attendance", modelName: "Attendance",
    columns: [
      { key: "studentId", header: "Student ID" },
      { key: "sessionDate", header: "Session", render: "formatDate(row.sessionDate as string)" },
      { key: "status", header: "Status", render: '<StatusBadge status={String(row.status)} />' },
    ],
  },
  {
    path: "app/admin/certificates/page.tsx",
    title: "Certificates", description: "Issued certificates",
    modelImports: "Certificate", modelName: "Certificate",
    columns: [
      { key: "title", header: "Title" },
      { key: "studentId", header: "Student ID" },
      { key: "issueDate", header: "Issued", render: "formatDate(row.issueDate as string)" },
      { key: "isShareable", header: "Shareable", render: 'row.isShareable ? "Yes" : "No"' },
    ],
  },
  {
    path: "app/admin/users/page.tsx",
    title: "Users", description: "All user accounts",
    modelImports: "User", modelName: "User",
    columns: [
      { key: "name", header: "Name" },
      { key: "email", header: "Email" },
      { key: "role", header: "Role", render: '<StatusBadge status={String(row.role)} />' },
      { key: "isActive", header: "Active", render: 'row.isActive ? "Yes" : "No"' },
      { key: "createdAt", header: "Joined", render: "formatDate(row.createdAt as string)" },
    ],
    rowHref: '"/admin/users/" + String(row._id)',
  },
  {
    path: "app/admin/gallery/page.tsx",
    title: "Gallery", description: "Gallery images",
    modelImports: "GalleryImage", modelName: "GalleryImage",
    columns: [
      { key: "title", header: "Title" },
      { key: "featured", header: "Featured", render: 'row.featured ? "Yes" : "No"' },
      { key: "status", header: "Status", render: '<StatusBadge status={String(row.status)} />' },
      { key: "order", header: "Order" },
    ],
  },
  {
    path: "app/admin/testimonials/page.tsx",
    title: "Testimonials", description: "Customer testimonials",
    modelImports: "Testimonial", modelName: "Testimonial",
    columns: [
      { key: "authorName", header: "Author" },
      { key: "authorRole", header: "Role" },
      { key: "rating", header: "Rating" },
      { key: "status", header: "Status", render: '<StatusBadge status={String(row.status)} />' },
    ],
  },
  {
    path: "app/admin/faqs/page.tsx",
    title: "FAQs", description: "Frequently asked questions",
    modelImports: "FAQ", modelName: "FAQ",
    query: "find().sort({ order: 1 }).lean()",
    columns: [
      { key: "question", header: "Question" },
      { key: "category", header: "Category" },
      { key: "order", header: "Order" },
      { key: "status", header: "Status", render: '<StatusBadge status={String(row.status)} />' },
    ],
  },
  {
    path: "app/admin/email-campaigns/page.tsx",
    title: "Email Campaigns", description: "Bulk email campaigns",
    modelImports: "EmailCampaign", modelName: "EmailCampaign",
    columns: [
      { key: "subject", header: "Subject" },
      { key: "type", header: "Type" },
      { key: "recipientCount", header: "Recipients" },
      { key: "status", header: "Status", render: '<StatusBadge status={String(row.status)} />' },
    ],
    action: { label: "New Campaign", href: "/admin/email-campaigns/new" },
    rowHref: '"/admin/email-campaigns/" + String(row._id)',
  },
  {
    path: "app/admin/messages/page.tsx",
    title: "Messages", description: "User messages and announcements",
    modelImports: "Message", modelName: "Message",
    columns: [
      { key: "subject", header: "Subject" },
      { key: "isAnnouncement", header: "Announcement", render: 'row.isAnnouncement ? "Yes" : "No"' },
      { key: "read", header: "Read", render: 'row.read ? "Yes" : "No"' },
      { key: "createdAt", header: "Sent", render: "formatDate(row.createdAt as string)" },
    ],
  },
  {
    path: "app/admin/subscribers/page.tsx",
    title: "Subscribers", description: "Newsletter subscribers",
    modelImports: "NewsletterSubscriber", modelName: "NewsletterSubscriber",
    columns: [
      { key: "email", header: "Email" },
      { key: "name", header: "Name" },
      { key: "verified", header: "Verified", render: 'row.verified ? "Yes" : "No"' },
      { key: "unsubscribed", header: "Unsubscribed", render: 'row.unsubscribed ? "Yes" : "No"' },
      { key: "createdAt", header: "Subscribed", render: "formatDate(row.createdAt as string)" },
    ],
  },
];

for (const p of listPages) {
  created.push(write(p.path, listPage(p)));
}

// Generic entity form component template
function entityForm(name, schemaFields, apiPath, listPath, defaults = "") {
  return `"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormField, TextInput, TextArea, SelectInput, CheckboxInput, FormActions, FormSection } from "@/components/admin/forms";
import { PageHeader } from "@/components/admin/PageHeader";
import { useState } from "react";

const schema = z.object({
${schemaFields}
});

type FormData = z.infer<typeof schema>;

interface ${name}FormProps {
  initialData?: Partial<FormData> & { _id?: string };
  isNew?: boolean;
}

export function ${name}Form({ initialData, isNew = false }: ${name}FormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
${defaults || schemaFields.split("\\n").map(l => {
  const m = l.match(/(\w+):/);
  return m ? `      ${m[1]}: initialData?.${m[1]} ?? ${l.includes("boolean") ? "false" : l.includes("number") ? "0" : '""'},"` : "";
}).filter(Boolean).join("\\n")}
    },
  });

  async function onSubmit(data: FormData) {
    setError(null);
    const url = isNew ? "${apiPath}" : \`${apiPath}/\${initialData?._id}\`;
    const method = isNew ? "POST" : "PUT";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) {
      setError(json.error ?? "Save failed");
      return;
    }
    router.push("${listPath}");
    router.refresh();
  }

  return (
    <div>
      <PageHeader title={isNew ? "Create ${name}" : "Edit ${name}"} />
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Details">
          {/* fields rendered by parent page */}
        </FormSection>
        <FormActions isSubmitting={isSubmitting} cancelHref="${listPath}" />
      </form>
    </div>
  );
}
`;
}

// Create specific form components manually for key entities
const forms = {
  EventForm: {
    path: "components/admin/forms/EventForm.tsx",
    content: `"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormField, TextInput, TextArea, SelectInput, CheckboxInput, FormActions, FormSection } from "@/components/admin/forms";
import { PageHeader } from "@/components/admin/PageHeader";
import { safeSlug } from "@/lib/utils";
import { useState } from "react";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1),
  shortDescription: z.string().min(1),
  fullDescription: z.string().min(1),
  location: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  timezone: z.string().default("America/New_York"),
  priceCents: z.coerce.number().min(0),
  capacity: z.coerce.number().optional(),
  isOnline: z.boolean().default(false),
  parentRequired: z.boolean().default(false),
  registrationEnabled: z.boolean().default(true),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published", "cancelled", "completed", "archived"]),
});

type FormData = z.infer<typeof schema>;

export function EventForm({ initialData, isNew = false }: { initialData?: Partial<FormData> & { _id?: string }; isNew?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialData?.title ?? "",
      slug: initialData?.slug ?? "",
      shortDescription: initialData?.shortDescription ?? "",
      fullDescription: initialData?.fullDescription ?? "",
      location: initialData?.location ?? "",
      startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().slice(0, 16) : "",
      endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : "",
      timezone: initialData?.timezone ?? "America/New_York",
      priceCents: initialData?.priceCents ?? 0,
      capacity: initialData?.capacity,
      isOnline: initialData?.isOnline ?? false,
      parentRequired: initialData?.parentRequired ?? false,
      registrationEnabled: initialData?.registrationEnabled ?? true,
      featured: initialData?.featured ?? false,
      status: (initialData?.status as FormData["status"]) ?? "draft",
    },
  });

  const title = watch("title");
  if (isNew && title) {
    setValue("slug", safeSlug(title));
  }

  async function onSubmit(data: FormData) {
    setError(null);
    const payload = { ...data, startDate: new Date(data.startDate), endDate: new Date(data.endDate) };
    const url = isNew ? "/api/admin/events" : \`/api/admin/events/\${initialData?._id}\`;
    const res = await fetch(url, { method: isNew ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json();
    if (!json.success) { setError(json.error ?? "Save failed"); return; }
    router.push("/admin/events");
    router.refresh();
  }

  return (
    <div>
      <PageHeader title={isNew ? "New Event" : "Edit Event"} />
      {error && <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Event Details">
          <FormField label="Title" error={errors.title} required className="sm:col-span-2">
            <TextInput registration={register("title")} error={errors.title} />
          </FormField>
          <FormField label="Slug" error={errors.slug} required>
            <TextInput registration={register("slug")} error={errors.slug} />
          </FormField>
          <FormField label="Status" error={errors.status}>
            <SelectInput registration={register("status")} error={errors.status} options={[
              { value: "draft", label: "Draft" }, { value: "published", label: "Published" },
              { value: "cancelled", label: "Cancelled" }, { value: "completed", label: "Completed" }, { value: "archived", label: "Archived" },
            ]} />
          </FormField>
          <FormField label="Short Description" error={errors.shortDescription} required className="sm:col-span-2">
            <TextArea registration={register("shortDescription")} error={errors.shortDescription} />
          </FormField>
          <FormField label="Full Description" error={errors.fullDescription} required className="sm:col-span-2">
            <TextArea registration={register("fullDescription")} error={errors.fullDescription} rows={6} />
          </FormField>
          <FormField label="Location" error={errors.location} required>
            <TextInput registration={register("location")} error={errors.location} />
          </FormField>
          <FormField label="Timezone" error={errors.timezone}>
            <TextInput registration={register("timezone")} error={errors.timezone} />
          </FormField>
          <FormField label="Start Date" error={errors.startDate} required>
            <TextInput registration={register("startDate")} error={errors.startDate} type="datetime-local" />
          </FormField>
          <FormField label="End Date" error={errors.endDate} required>
            <TextInput registration={register("endDate")} error={errors.endDate} type="datetime-local" />
          </FormField>
          <FormField label="Price (cents)" error={errors.priceCents}>
            <TextInput registration={register("priceCents")} error={errors.priceCents} type="number" />
          </FormField>
          <FormField label="Capacity" error={errors.capacity}>
            <TextInput registration={register("capacity")} error={errors.capacity} type="number" />
          </FormField>
          <div className="flex flex-col gap-3 sm:col-span-2">
            <CheckboxInput registration={register("isOnline")} label="Online event" />
            <CheckboxInput registration={register("parentRequired")} label="Parent required" />
            <CheckboxInput registration={register("registrationEnabled")} label="Registration enabled" />
            <CheckboxInput registration={register("featured")} label="Featured" />
          </div>
        </FormSection>
        <FormActions isSubmitting={isSubmitting} cancelHref="/admin/events" />
      </form>
    </div>
  );
}
`,
  },
};

for (const [_, f] of Object.entries(forms)) {
  created.push(write(f.path, f.content));
}

// New/Edit pages for entities with forms
const entityPages = [
  { new: "app/admin/events/new/page.tsx", edit: "app/admin/events/[id]/page.tsx", form: "EventForm", api: "events", model: "Event" },
];

for (const ep of entityPages) {
  created.push(write(ep.new, `import { ${ep.form} } from "@/components/admin/forms/${ep.form}";
export default function Page() { return <${ep.form} isNew />; }
`));
  created.push(write(ep.edit, `import connectDB from "@/lib/db";
import { ${ep.model} } from "@/models";
import { ${ep.form} } from "@/components/admin/forms/${ep.form}";
import { serialize } from "@/lib/admin/serialize";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  const item = await ${ep.model}.findById(id).lean();
  if (!item) notFound();
  return <${ep.form} initialData={serialize(item)} />;
}
`));
}

console.log(JSON.stringify(created, null, 2));
console.error(`Created ${created.length} files`);

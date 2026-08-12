import nodemailer from "nodemailer";
import connectDB from "@/lib/db";
import { EmailJob } from "@/models";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USERNAME;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD);
}

export async function queueEmail(params: {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  template: string;
  campaignId?: string;
  metadata?: Record<string, string>;
}): Promise<string> {
  await connectDB();
  const job = await EmailJob.create({
    ...params,
    status: "queued",
  });
  return job._id.toString();
}

export async function processEmailQueue(limit = 20): Promise<{ sent: number; failed: number }> {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error("SMTP is not configured");
  }

  await connectDB();
  const jobs = await EmailJob.find({ status: "queued" })
    .sort({ createdAt: 1 })
    .limit(limit);

  let sent = 0;
  let failed = 0;

  const from = `"${process.env.SMTP_SENDER_NAME || "Explore More Academy"}" <${process.env.SMTP_SENDER_EMAIL || process.env.SMTP_USERNAME}>`;

  for (const job of jobs) {
    try {
      job.status = "sending";
      job.attempts += 1;
      await job.save();

      await transporter.sendMail({
        from,
        to: job.to,
        replyTo: process.env.SMTP_REPLY_TO,
        subject: job.subject,
        html: job.htmlBody,
        text: job.textBody,
      });

      job.status = "sent";
      job.sentAt = new Date();
      await job.save();
      sent++;
    } catch (error) {
      job.status = job.attempts >= 3 ? "failed" : "queued";
      job.lastError = error instanceof Error ? error.message : "Unknown error";
      await job.save();
      failed++;
    }
  }

  return { sent, failed };
}

export function wrapEmailTemplate(content: string, unsubscribeUrl?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const unsub = unsubscribeUrl || `${baseUrl}/unsubscribe`;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,sans-serif;background:#faf8f1;color:#101315;margin:0;padding:0">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px">
    <div style="text-align:center;margin-bottom:24px">
      <strong style="color:#0c8991;font-size:18px">Explore More Academy</strong>
      <p style="color:#666;font-size:12px;margin:4px 0">Learn Wild. Live Big.</p>
    </div>
    ${content}
    <hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0">
    <p style="font-size:11px;color:#888;text-align:center">
      Explore More Academy LLC · chris@exploremoreacademy.com<br>
      <a href="${unsub}" style="color:#0c8991">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`;
}

export const emailTemplates = {
  verification: (name: string, url: string) => ({
    subject: "Verify your Explore More Academy account",
    html: wrapEmailTemplate(`
      <h2 style="color:#101315">Welcome, ${name}!</h2>
      <p>Please verify your email address to activate your account.</p>
      <a href="${url}" style="display:inline-block;background:#ff5a16;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Verify Email</a>
    `),
  }),
  passwordReset: (name: string, url: string) => ({
    subject: "Reset your password",
    html: wrapEmailTemplate(`
      <h2 style="color:#101315">Password Reset</h2>
      <p>Hi ${name}, click below to reset your password. This link expires in 1 hour.</p>
      <a href="${url}" style="display:inline-block;background:#0c8991;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Reset Password</a>
    `),
  }),
  welcome: (name: string) => ({
    subject: "Welcome to Explore More Academy!",
    html: wrapEmailTemplate(`
      <h2 style="color:#101315">Your adventure begins, ${name}!</h2>
      <p>Thank you for joining Explore More Academy. Explore our programs, events, and courses to start your journey.</p>
    `),
  }),
  orderConfirmation: (name: string, orderNumber: string, total: string) => ({
    subject: `Order Confirmation — ${orderNumber}`,
    html: wrapEmailTemplate(`
      <h2 style="color:#101315">Thank you for your order!</h2>
      <p>Hi ${name}, your order <strong>${orderNumber}</strong> has been confirmed.</p>
      <p>Total: <strong>${total}</strong></p>
    `),
  }),
  donationConfirmation: (name: string, amount: string, campaign: string) => ({
    subject: "Thank you for your donation!",
    html: wrapEmailTemplate(`
      <h2 style="color:#101315">Thank you, ${name}!</h2>
      <p>Your donation of <strong>${amount}</strong> to <strong>${campaign}</strong> has been received.</p>
    `),
  }),
  enrollmentConfirmation: (name: string, course: string) => ({
    subject: `Enrolled in ${course}`,
    html: wrapEmailTemplate(`
      <h2 style="color:#101315">You're enrolled!</h2>
      <p>Hi ${name}, you are now enrolled in <strong>${course}</strong>.</p>
    `),
  }),
  eventRegistration: (name: string, event: string, date: string) => ({
    subject: `Registered for ${event}`,
    html: wrapEmailTemplate(`
      <h2 style="color:#101315">Event Registration Confirmed</h2>
      <p>Hi ${name}, you're registered for <strong>${event}</strong> on ${date}.</p>
    `),
  }),
  serviceRequest: (name: string, program: string) => ({
    subject: "Service Request Received",
    html: wrapEmailTemplate(`
      <h2 style="color:#101315">We received your request</h2>
      <p>Hi ${name}, thank you for your interest in <strong>${program}</strong>. Our team will contact you soon.</p>
    `),
  }),
  newContent: (name: string, title: string, type: string, url: string) => ({
    subject: `New ${type}: ${title}`,
    html: wrapEmailTemplate(`
      <h2 style="color:#101315">New ${type} Available!</h2>
      <p>Hi ${name}, check out our latest ${type.toLowerCase()}: <strong>${title}</strong></p>
      <a href="${url}" style="display:inline-block;background:#b8ef24;color:#070809;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">View Details</a>
    `),
  }),
};

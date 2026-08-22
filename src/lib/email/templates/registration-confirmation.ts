import { sendTransactionalEmail } from "@/lib/services/email";

/**
 * Email template for event registration confirmation
 */

interface RegistrationData {
  registrationId: string;
  studentName: string;
  guardianName: string;
  guardianEmail: string;
  paymentStatus: string;
  paymentAmount?: number;
  status: string;
}

interface EventData {
  title: string;
  startDate: Date | string;
  endDate: Date | string;
  startTime: string;
  endTime: string;
  location: string;
  instructions?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export async function sendRegistrationConfirmation({
  registration,
  event,
}: {
  registration: RegistrationData;
  event: EventData;
}) {
  // Format dates
  const startDate = new Date(event.startDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const endDate = new Date(event.endDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Build email content
  const subject = `Registration Confirmation: ${event.title}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #0a0f1e; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Registration Confirmed!</h1>
      </div>
      
      <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Dear ${registration.guardianName},</p>
        
        <p>Thank you for registering <strong>${registration.studentName}</strong> for our event! We're excited to have you join us.</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00d9ff;">
          <h2 style="margin-top: 0; color: #0a0f1e;">Event Details</h2>
          <p><strong>Event:</strong> ${event.title}</p>
          <p><strong>Date:</strong> ${startDate}${endDate !== startDate ? ` - ${endDate}` : ""}</p>
          <p><strong>Time:</strong> ${event.startTime} - ${event.endTime}</p>
          <p><strong>Location:</strong> ${event.location}</p>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #0a0f1e;">Registration Information</h2>
          <p><strong>Confirmation Number:</strong> <span style="font-family: monospace; background-color: #e8f4f8; padding: 4px 8px; border-radius: 4px;">${registration.registrationId}</span></p>
          <p><strong>Student Name:</strong> ${registration.studentName}</p>
          <p><strong>Registration Status:</strong> ${registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}</p>
          ${
            registration.paymentStatus === "paid"
              ? `<p><strong>Payment Status:</strong> Paid ${registration.paymentAmount ? `($${registration.paymentAmount.toFixed(2)})` : ""}</p>`
              : registration.paymentStatus === "pending"
              ? `<p><strong>Payment Status:</strong> Pending ${registration.paymentAmount ? `($${registration.paymentAmount.toFixed(2)})` : ""}</p>`
              : `<p><strong>Payment Status:</strong> Free Event</p>`
          }
        </div>
        
        ${
          event.instructions
            ? `
        <div style="background-color: #fff9e6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffd700;">
          <h2 style="margin-top: 0; color: #0a0f1e;">Important Instructions</h2>
          <p>${event.instructions.replace(/\n/g, "<br>")}</p>
        </div>
        `
            : ""
        }
        
        ${
          event.contactName || event.contactEmail || event.contactPhone
            ? `
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #0a0f1e;">Contact Information</h2>
          ${event.contactName ? `<p><strong>Contact:</strong> ${event.contactName}</p>` : ""}
          ${event.contactEmail ? `<p><strong>Email:</strong> <a href="mailto:${event.contactEmail}">${event.contactEmail}</a></p>` : ""}
          ${event.contactPhone ? `<p><strong>Phone:</strong> ${event.contactPhone}</p>` : ""}
        </div>
        `
            : ""
        }
        
        <div style="background-color: #ffe6e6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6b6b;">
          <h3 style="margin-top: 0; color: #0a0f1e;">Cancellation Policy</h3>
          <p>If you need to cancel your registration, please contact us as soon as possible${event.contactEmail ? ` at ${event.contactEmail}` : ""}. Include your confirmation number (${registration.registrationId}) in your message.</p>
        </div>
        
        <p>Please bring a copy of this confirmation email (printed or on your mobile device) to the event.</p>
        
        <p>We look forward to seeing you!</p>
        
        <p style="margin-top: 30px;">
          Best regards,<br>
          <strong>Explore More Academy Team</strong>
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
        <p>This is an automated confirmation email. Please do not reply directly to this message.</p>
        <p>&copy; ${new Date().getFullYear()} Explore More Academy. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
Registration Confirmation: ${event.title}

Dear ${registration.guardianName},

Thank you for registering ${registration.studentName} for our event!

EVENT DETAILS
Event: ${event.title}
Date: ${startDate}${endDate !== startDate ? ` - ${endDate}` : ""}
Time: ${event.startTime} - ${event.endTime}
Location: ${event.location}

REGISTRATION INFORMATION
Confirmation Number: ${registration.registrationId}
Student Name: ${registration.studentName}
Registration Status: ${registration.status}
${registration.paymentStatus === "paid" ? `Payment Status: Paid ${registration.paymentAmount ? `($${registration.paymentAmount.toFixed(2)})` : ""}` : registration.paymentStatus === "pending" ? `Payment Status: Pending ${registration.paymentAmount ? `($${registration.paymentAmount.toFixed(2)})` : ""}` : "Payment Status: Free Event"}

${event.instructions ? `IMPORTANT INSTRUCTIONS\n${event.instructions}\n\n` : ""}

${event.contactName || event.contactEmail || event.contactPhone ? `CONTACT INFORMATION\n${event.contactName ? `Contact: ${event.contactName}\n` : ""}${event.contactEmail ? `Email: ${event.contactEmail}\n` : ""}${event.contactPhone ? `Phone: ${event.contactPhone}\n` : ""}\n` : ""}

CANCELLATION POLICY
If you need to cancel your registration, please contact us as soon as possible${event.contactEmail ? ` at ${event.contactEmail}` : ""}. Include your confirmation number (${registration.registrationId}) in your message.

Please bring a copy of this confirmation to the event.

We look forward to seeing you!

Best regards,
Explore More Academy Team
  `;

  // Send email using transactional email service
  await sendTransactionalEmail({
    to: registration.guardianEmail,
    subject,
    htmlBody: html,
    textBody: text,
    template: "registration-confirmation",
  });

  return { success: true, subject, to: registration.guardianEmail };
}

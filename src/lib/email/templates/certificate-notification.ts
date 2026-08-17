/**
 * Email template for certificate notification to parents
 */

interface Guardian {
  name: string;
  email: string;
}

interface Student {
  name: string;
  studentId?: string;
}

interface Certificate {
  title: string;
  description?: string;
  issueDate: Date;
  filePath: string;
  fileType: string;
}

export async function sendCertificateNotification({
  guardian,
  student,
  certificate,
}: {
  guardian: Guardian;
  student: Student;
  certificate: Certificate;
}) {
  const issueDate = new Date(certificate.issueDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subject = `New Certificate Issued for ${student.name}`;

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
        <h1 style="margin: 0; font-size: 28px;">🎓 New Certificate!</h1>
      </div>
      
      <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Dear ${guardian.name},</p>
        
        <p>We're excited to let you know that <strong>${student.name}</strong> has been awarded a new certificate!</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00d9ff;">
          <h2 style="margin-top: 0; color: #0a0f1e;">Certificate Details</h2>
          <p><strong>Title:</strong> ${certificate.title}</p>
          ${certificate.description ? `<p><strong>Description:</strong> ${certificate.description}</p>` : ""}
          <p><strong>Issue Date:</strong> ${issueDate}</p>
          ${student.studentId ? `<p><strong>Student ID:</strong> ${student.studentId}</p>` : ""}
        </div>
        
        ${
          certificate.fileType === "image"
            ? `
        <div style="text-align: center; margin: 20px 0;">
          <p style="margin-bottom: 10px; font-weight: bold;">Certificate Preview:</p>
          <img src="${certificate.filePath}" alt="Certificate" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px;" />
        </div>
        `
            : ""
        }
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${certificate.filePath}" 
             style="display: inline-block; background-color: #00d9ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;"
             target="_blank">
            ${certificate.fileType === "image" ? "Download Certificate" : "View Certificate PDF"}
          </a>
        </div>
        
        <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0a0f1e;">View in Parent Portal</h3>
          <p>This certificate is now available in your Parent Portal under your student's certificates section.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/parent/students" 
             style="color: #00d9ff; text-decoration: none;">
            Go to Parent Portal →
          </a>
        </div>
        
        <p>Congratulations to ${student.name} on this achievement! The certificate will remain available in the student's permanent certificate section.</p>
        
        <p style="margin-top: 30px;">
          Best regards,<br>
          <strong>Explore More Academy Team</strong>
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
        <p>This is an automated notification. Please do not reply directly to this message.</p>
        <p>&copy; ${new Date().getFullYear()} Explore More Academy. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
New Certificate Issued for ${student.name}

Dear ${guardian.name},

We're excited to let you know that ${student.name} has been awarded a new certificate!

CERTIFICATE DETAILS
Title: ${certificate.title}
${certificate.description ? `Description: ${certificate.description}\n` : ""}Issue Date: ${issueDate}
${student.studentId ? `Student ID: ${student.studentId}\n` : ""}

You can view and download the certificate here:
${certificate.filePath}

VIEW IN PARENT PORTAL
This certificate is now available in your Parent Portal under your student's certificates section.
${process.env.NEXT_PUBLIC_APP_URL}/parent/students

Congratulations to ${student.name} on this achievement! The certificate will remain available in the student's permanent certificate section.

Best regards,
Explore More Academy Team
  `;

  // TODO: Integrate with your email service (SendGrid, AWS SES, etc.)
  console.log("Sending certificate notification to:", guardian.email);
  console.log("Subject:", subject);
  
  // Example integration:
  // await emailService.send({
  //   to: guardian.email,
  //   subject,
  //   html,
  //   text,
  // });

  return { success: true, subject, to: guardian.email };
}

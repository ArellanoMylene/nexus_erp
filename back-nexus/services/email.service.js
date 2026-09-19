import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Configure Nodemailer transport using environment variables.
 * If SMTP credentials are not provided, it falls back to console logging (dev mode).
 */
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
};

/**
 * Generate a modern, accessible HTML email template for OTP verification.
 */
const getVerificationEmailHtml = ({ firstName, verificationCode, expiresMinutes = 15 }) => {
  const safeName = firstName ? ` ${firstName}` : "";
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nexus Email Verification</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 40px 16px;
    }
    .card {
      max-width: 520px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #172554 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.025em;
    }
    .header p {
      margin: 6px 0 0;
      font-size: 13px;
      color: #93c5fd;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .content {
      padding: 36px 32px;
    }
    .greeting {
      font-size: 17px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 12px;
    }
    .message {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 24px;
    }
    .otp-container {
      text-align: center;
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
    .otp-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 8px;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 36px;
      font-weight: 800;
      color: #d97706;
      letter-spacing: 0.35em;
      margin-left: 0.35em;
    }
    .expiry-note {
      font-size: 12px;
      color: #64748b;
      margin-top: 10px;
    }
    .warning {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.5;
      border-top: 1px solid #f1f5f9;
      padding-top: 20px;
      margin-top: 24px;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>Nexus Academic Portal</h1>
        <p>Registration Email Verification</p>
      </div>
      <div class="content">
        <div class="greeting">Hello${safeName},</div>
        <p class="message">
          Thank you for registering on Nexus. To complete your account registration and activate your portal access, please enter the following 6-digit verification code:
        </p>

        <div class="otp-container">
          <div class="otp-label">Verification Code</div>
          <div class="otp-code">${verificationCode}</div>
          <div class="expiry-note">⏱️ This code will expire in ${expiresMinutes} minutes.</div>
        </div>

        <p class="message" style="margin-bottom: 0;">
          Enter this code in your registration verification screen to finalize your registration.
        </p>

        <div class="warning">
          If you did not initiate this registration, please disregard this email. No changes will be made without verifying this code.
        </div>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} Nexus Academic Portal. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
`;
};

/**
 * Send the 6-digit email verification code to the recipient.
 *
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} [params.firstName] - Recipient's first name
 * @param {string} params.code - 6-digit verification code
 * @param {number} [params.expiresMinutes=15] - Expiration duration in minutes
 * @returns {Promise<{ delivered: boolean, mode: string }>}
 */
export const sendVerificationEmail = async ({
  to,
  firstName = "",
  code,
  expiresMinutes = 15,
}) => {
  const from = process.env.SMTP_FROM || `"Nexus Portal" <noreply@nexus.edu>`;
  const transporter = createTransporter();

  if (!transporter) {
    return { delivered: false, mode: "console-fallback" };
  }

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `Nexus Email Verification Code: ${code}`,
      text: `Your Nexus registration verification code is: ${code}. It expires in ${expiresMinutes} minutes.`,
      html: getVerificationEmailHtml({ firstName, verificationCode: code, expiresMinutes }),
    });

    return { delivered: true, mode: "smtp" };
  } catch (error) {
    console.error("⚠️ Failed to send verification email via SMTP:", error.message);
    // Even if SMTP fails, the code is logged to console so user testing is never blocked
    return { delivered: false, error: error.message, mode: "smtp-error" };
  }
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const sendPortalEmail = async ({ to, firstName = "", subject, text, title, message }) => {
  const from = process.env.SMTP_FROM || `"Nexus Portal" <noreply@nexus.edu>`;
  const transporter = createTransporter();
  const safeName = escapeHtml(firstName || "Student");

  if (!transporter) {
    return { delivered: false, mode: "console-fallback" };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#1e293b">
          <h2 style="color:#1e3a8a">${escapeHtml(title)}</h2>
          <p>Hello ${safeName},</p>
          <p>${escapeHtml(message)}</p>
          <p>Log in to the Nexus Academic Portal for more details.</p>
          <hr><small>Nexus Academic Portal</small>
        </div>
      `,
    });
    return { delivered: true, mode: "smtp" };
  } catch (error) {
    console.error("⚠️ Failed to send portal email via SMTP:", error.message);
    return { delivered: false, error: error.message, mode: "smtp-error" };
  }
};

export const sendAdmissionSubmittedEmail = async ({ to, firstName, program }) =>
  sendPortalEmail({
    to,
    firstName,
    subject: "Nexus admission application received",
    title: "Admission Application Received",
    text: `Your admission application${program ? ` for ${program}` : ""} was submitted successfully and is now under review.`,
    message: `Your admission application${program ? ` for ${program}` : ""} was submitted successfully and is now under review.`,
  });

export const sendAdmissionStatusEmail = async ({ to, firstName, status, program, remarks }) => {
  const isEnrolled = String(status).toLowerCase() === "enrolled";
  const message = isEnrolled
    ? `Your admission has been approved and your enrollment${program ? ` for ${program}` : ""} is confirmed.`
    : `Your admission application${program ? ` for ${program}` : ""} has been marked ${status}.`;

  return sendPortalEmail({
    to,
    firstName,
    subject: `Nexus admission status: ${status}`,
    title: isEnrolled ? "Enrollment Confirmed" : "Admission Status Updated",
    text: `${message}${remarks ? ` Remarks: ${remarks}` : ""}`,
    message: `${message}${remarks ? ` Remarks: ${remarks}` : ""}`,
  });
};

export const sendEnrollmentSubmittedEmail = async ({
  to,
  firstName,
  course,
  schoolYear,
  semester,
}) => {
  const period = [schoolYear, semester].filter(Boolean).join(" - ");
  const message = `Your enrollment application${course ? ` for ${course}` : ""}${period ? ` (${period})` : ""} was submitted successfully.`;

  return sendPortalEmail({
    to,
    firstName,
    subject: "Nexus enrollment application received",
    title: "Enrollment Application Received",
    text: message,
    message,
  });
};

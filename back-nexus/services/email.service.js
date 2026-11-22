import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Singleton SMTP transporter with connection pooling.
 * Gmail throttles/blocks rapid repeated new connections from the same app.
 * By reusing a single pooled transporter, all emails share one persistent
 * connection and subsequent sends no longer fail.
 */
let _transporter = null;

const getTransporter = () => {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  // Port 465 uses direct SSL (secure: true). Port 587 uses STARTTLS (secure: false).
  const secureSetting = String(process.env.SMTP_SECURE || "").trim().toLowerCase();
  const secure = secureSetting
    ? ["true", "1", "yes"].includes(secureSetting)
    : port === 465;

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    pool: true,       // enable connection pooling
    maxConnections: 3, // max simultaneous connections
    maxMessages: 100,  // max messages per connection before reconnect
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  return _transporter;
};

const getFromAddress = (displayName, fallbackAddress = "noreply@nexus.edu") => {
  const configuredFrom = String(process.env.SMTP_FROM || "").trim();
  if (configuredFrom) return configuredFrom;
  const mailbox = String(process.env.SMTP_USER || "").trim();
  return `"${displayName}" <${mailbox || fallbackAddress}>`;
};

/**
 * Safely escape HTML characters.
 */
const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

/**
 * Master Unified HTML Email Template Generator
 * Guarantees 100% visual consistency across all notification and verification emails.
 */
const renderUnifiedEmailHtml = ({
  headerTitle = "NexusERP Academic Portal",
  headerSubtitle = "Official Notification",
  headerGradient = "linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)",
  greetingName = "",
  introMessage = "",
  otpBlock = null, // { code, expiresMinutes }
  details = [], // [ { label, value, isBadge, badgeType } ]
  alertBox = null, // { type: 'warning'|'danger'|'info'|'success', title, message }
  actionButton = null, // { text, url }
  additionalNote = "",
  warningHtml = "",
}) => {
  const safeGreeting = greetingName ? ` ${escapeHtml(greetingName)}` : "";
  const currentYear = new Date().getFullYear();

  // Generate Key-Value Details Rows if provided
  let detailsHtml = "";
  if (details && details.length > 0) {
    const rows = details
      .map((item, idx) => {
        const isLast = idx === details.length - 1;
        const borderStyle = isLast ? "" : "border-bottom: 1px solid #edf2f7;";
        
        let valueHtml = escapeHtml(item.value);
        if (item.isBadge) {
          let badgeBg = "#dbeafe";
          let badgeColor = "#1e40af";
          if (item.badgeType === "success") {
            badgeBg = "#dcfce7";
            badgeColor = "#166534";
          } else if (item.badgeType === "warning") {
            badgeBg = "#fef3c7";
            badgeColor = "#92400e";
          } else if (item.badgeType === "danger") {
            badgeBg = "#fee2e2";
            badgeColor = "#991b1b";
          }
          valueHtml = `<span style="display:inline-block;padding:3px 10px;border-radius:6px;font-size:12px;font-weight:700;background:${badgeBg};color:${badgeColor};">${escapeHtml(item.value)}</span>`;
        }

        return `
          <tr style="${borderStyle}">
            <td style="padding: 10px 0; font-size: 13px; color: #64748b; font-weight: 600; vertical-align: top; width: 40%;">${escapeHtml(item.label)}:</td>
            <td style="padding: 10px 0; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right; vertical-align: top; width: 60%;">${valueHtml}</td>
          </tr>
        `;
      })
      .join("");

    detailsHtml = `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin: 22px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          ${rows}
        </table>
      </div>
    `;
  }

  // Generate OTP Component if provided
  let otpHtml = "";
  if (otpBlock && otpBlock.code) {
    const safeCode = escapeHtml(otpBlock.code);
    const expires = otpBlock.expiresMinutes || 15;
    otpHtml = `
      <div style="text-align: center; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 8px;">
          Verification Code
        </div>
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; color: #d97706; letter-spacing: 0.35em; margin-left: 0.35em;">
          ${safeCode}
        </div>
        <div style="font-size: 12px; color: #64748b; margin-top: 10px;">
          ⏱️ This code will expire in ${expires} minutes.
        </div>
      </div>
    `;
  }

  // Generate Alert Box if provided
  let alertBoxHtml = "";
  if (alertBox) {
    let bg = "#f8fafc";
    let border = "#e2e8f0";
    let borderLeft = "#64748b";
    let titleColor = "#0f172a";
    let textColor = "#334155";

    if (alertBox.type === "warning") {
      bg = "#fffbeb";
      border = "#fef3c7";
      borderLeft = "#f59e0b";
      titleColor = "#92400e";
      textColor = "#78350f";
    } else if (alertBox.type === "danger") {
      bg = "#fef2f2";
      border = "#fee2e2";
      borderLeft = "#ef4444";
      titleColor = "#991b1b";
      textColor = "#7f1d1d";
    } else if (alertBox.type === "success") {
      bg = "#f0fdf4";
      border = "#dcfce7";
      borderLeft = "#22c55e";
      titleColor = "#166534";
      textColor = "#14532d";
    } else if (alertBox.type === "info") {
      bg = "#eff6ff";
      border = "#dbeafe";
      borderLeft = "#3b82f6";
      titleColor = "#1e40af";
      textColor = "#1e3a8a";
    }

    alertBoxHtml = `
      <div style="background: ${bg}; border: 1px solid ${border}; border-left: 4px solid ${borderLeft}; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
        ${alertBox.title ? `<div style="font-size: 13px; font-weight: 700; color: ${titleColor}; margin-bottom: 4px;">${escapeHtml(alertBox.title)}</div>` : ""}
        <div style="font-size: 13px; color: ${textColor}; line-height: 1.5;">${alertBox.message}</div>
      </div>
    `;
  }

  // Action CTA Button
  let buttonHtml = "";
  if (actionButton && actionButton.url && actionButton.text) {
    buttonHtml = `
      <div style="text-align: center; margin: 28px 0 16px 0;">
        <a href="${escapeHtml(actionButton.url)}" style="display: inline-block; background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); color: #ffffff !important; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
          ${escapeHtml(actionButton.text)}
        </a>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(headerTitle)}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <div style="width: 100%; background-color: #f1f5f9; padding: 40px 16px; box-sizing: border-box;">
    <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #e2e8f0;">
      
      <!-- Brand Header -->
      <div style="background: ${headerGradient}; padding: 32px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.025em; color: #ffffff;">
          ${escapeHtml(headerTitle)}
        </h1>
        <p style="margin: 6px 0 0; font-size: 12px; color: #93c5fd; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700;">
          ${escapeHtml(headerSubtitle)}
        </p>
      </div>

      <!-- Main Content -->
      <div style="padding: 36px 32px;">
        <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">
          Hello${safeGreeting},
        </div>
        
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px 0;">
          ${introMessage}
        </p>

        ${otpHtml}
        ${detailsHtml}
        ${alertBoxHtml}
        ${buttonHtml}

        ${
          additionalNote
            ? `<p style="font-size: 13px; line-height: 1.5; color: #64748b; margin: 16px 0 0 0; text-align: center;">${additionalNote}</p>`
            : ""
        }

        ${
          warningHtml
            ? `<div style="font-size: 12px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 24px;">${warningHtml}</div>`
            : ""
        }
      </div>

      <!-- Unified Footer -->
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; line-height: 1.5;">
        <div>© ${currentYear} NexusERP Academic Portal. All rights reserved.</div>
        <div style="margin-top: 4px; font-size: 10px; color: #cbd5e1;">This is an automated system notification. Please do not reply directly to this email.</div>
      </div>

    </div>
  </div>
</body>
</html>`;
};

/**
 * 1. Generate HTML email template for OTP email verification.
 */
export const getVerificationEmailHtml = ({ firstName, verificationCode, expiresMinutes = 15 }) => {
  return renderUnifiedEmailHtml({
    headerTitle: "NexusERP Academic Portal",
    headerSubtitle: "Registration Email Verification",
    greetingName: firstName,
    introMessage:
      "Thank you for registering on NexusERP. To complete your registration and activate your account, please enter the following 6-digit verification code:",
    otpBlock: {
      code: verificationCode,
      expiresMinutes,
    },
    additionalNote:
      "Enter this code in your registration verification screen to finalize your registration.",
    warningHtml:
      "If you did not initiate this registration request, please disregard this email. No changes will be made without verifying this code.",
  });
};

/**
 * Send the 6-digit email verification code to the recipient.
 */
export const sendVerificationEmail = async ({
  to,
  firstName = "",
  code,
  expiresMinutes = 15,
}) => {
  const from = getFromAddress("Nexus Portal");
  const transporter = getTransporter();

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
    return { delivered: false, error: error.message, mode: "smtp-error" };
  }
};

/**
 * 2. Generate HTML email template for new account welcome notification.
 */
export const getWelcomeEmailHtml = ({ firstName, role, identifier, email, loginUrl }) => {
  const roleName = role || "Member";
  const idLabel = role === "Student" ? "Student ID" : "Employee ID";

  return renderUnifiedEmailHtml({
    headerTitle: "NexusERP Academic Portal",
    headerSubtitle: "Account Registration Confirmation",
    greetingName: firstName,
    introMessage:
      "Welcome to <strong>NexusERP</strong>! Your official user account has been created by the administration. You can now sign in to access your dashboard, academic records, and portal services.",
    details: [
      { label: "Account Email", value: email || "" },
      { label: "Assigned Role", value: roleName, isBadge: true, badgeType: "info" },
      { label: idLabel, value: identifier || "Assigned on login" },
    ],
    actionButton: {
      text: "Log In to NexusERP Portal",
      url: loginUrl || process.env.CLIENT_URL || "http://localhost:5173",
    },
    additionalNote:
      "If you have questions regarding your account or need access assistance, please reach out to your HR or Registrar administrator.",
    warningHtml:
      "<strong>Security Notice:</strong> Keep your login credentials secure at all times. NexusERP staff will never ask for your password.",
  });
};

/**
 * Send welcome notification when an account is created by HR, Registrar, or Administrator.
 */
export const sendAccountWelcomeEmail = async ({
  to,
  firstName = "",
  role = "User",
  identifier = "",
  loginUrl = process.env.CLIENT_URL || "http://localhost:5173",
}) => {
  const from = getFromAddress("Nexus Portal");
  const transporter = getTransporter();

  if (!transporter) {
    return { delivered: false, mode: "console-fallback" };
  }

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `Welcome to NexusERP - Your ${role} Account is Ready`,
      text: `Hello ${firstName}, welcome to NexusERP! Your ${role} account has been created. Identifier: ${identifier}. Log in at: ${loginUrl}`,
      html: getWelcomeEmailHtml({ firstName, role, identifier, email: to, loginUrl }),
    });

    return { delivered: true, mode: "smtp" };
  } catch (error) {
    console.error("⚠️ Failed to send account welcome email via SMTP:", error.message);
    return { delivered: false, error: error.message, mode: "smtp-error" };
  }
};

/**
 * 3. Generate HTML email template for password change security alert.
 */
export const getPasswordChangedEmailHtml = ({ firstName, changedAt, changedByAdmin = false, loginUrl }) => {
  return renderUnifiedEmailHtml({
    headerTitle: "NexusERP Security Alert",
    headerSubtitle: "Password Update Notice",
    greetingName: firstName,
    introMessage:
      "This is an automated security notification to confirm that the password for your <strong>NexusERP Portal</strong> account has been successfully changed.",
    details: [
      { label: "Activity", value: "Password Updated" },
      { label: "Timestamp", value: changedAt || new Date().toLocaleString() },
      {
        label: "Initiated By",
        value: changedByAdmin ? "Administrator / HR" : "Self-Service Update",
        isBadge: true,
        badgeType: changedByAdmin ? "warning" : "info",
      },
    ],
    alertBox: {
      type: "danger",
      title: "⚠️ Did not authorize this change?",
      message:
        "If you did not change or authorize this password modification, please contact your Nexus administrator or HR immediately to secure your account.",
    },
    actionButton: {
      text: "Log In to NexusERP Portal",
      url: loginUrl || process.env.CLIENT_URL || "http://localhost:5173",
    },
    additionalNote:
      "If you performed this action, no further steps are required. You can use your new password next time you sign in.",
    warningHtml:
      "NexusERP will never request your sensitive password or personal credentials via email.",
  });
};

/**
 * Send security notification when a user's password is changed.
 */
export const sendPasswordChangedEmail = async ({
  to,
  firstName = "",
  changedAt = new Date().toLocaleString(),
  changedByAdmin = false,
  loginUrl = process.env.CLIENT_URL || "http://localhost:5173",
}) => {
  const from = getFromAddress("Nexus Security");
  const transporter = getTransporter();

  if (!transporter) {
    return { delivered: false, mode: "console-fallback" };
  }

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `NexusERP Security Alert: Your Password Was Changed`,
      text: `Hello ${firstName}, your NexusERP password was successfully changed on ${changedAt}. If you did not make this change, contact your administrator immediately.`,
      html: getPasswordChangedEmailHtml({ firstName, changedAt, changedByAdmin, loginUrl }),
    });

    return { delivered: true, mode: "smtp" };
  } catch (error) {
    console.error("⚠️ Failed to send password changed notification email via SMTP:", error.message);
    return { delivered: false, error: error.message, mode: "smtp-error" };
  }
};

/**
 * 4. Send admission application submitted notification.
 */
export const sendAdmissionSubmittedEmail = async ({
  to,
  firstName = "",
  program = "",
  loginUrl = process.env.CLIENT_URL || "http://localhost:5173",
}) => {
  const from = getFromAddress("Nexus Admissions");
  const transporter = getTransporter();

  if (!transporter) {
    return { delivered: false, mode: "console-fallback" };
  }

  const html = renderUnifiedEmailHtml({
    headerTitle: "NexusERP Academic Portal",
    headerSubtitle: "Admission Application Received",
    greetingName: firstName,
    introMessage:
      "Thank you for submitting your admission application to NexusERP. Your application has been successfully received and is now queued for evaluation by our admissions team.",
    details: [
      { label: "Program Applied", value: program || "General Admission" },
      { label: "Application Status", value: "Under Review", isBadge: true, badgeType: "info" },
      { label: "Date Received", value: new Date().toLocaleDateString() },
    ],
    actionButton: {
      text: "View Admission Portal",
      url: loginUrl,
    },
    additionalNote:
      "You will receive further updates via email once your application documents and requirements have been reviewed.",
    warningHtml:
      "Please ensure that all required supporting documents are submitted to avoid delays in your evaluation.",
  });

  try {
    await transporter.sendMail({
      from,
      to,
      subject: "Nexus Admission Application Received",
      text: `Hello ${firstName}, your admission application${program ? ` for ${program}` : ""} was submitted successfully and is now under review.`,
      html,
    });
    return { delivered: true, mode: "smtp" };
  } catch (error) {
    console.error("⚠️ Failed to send admission submitted email via SMTP:", error.message);
    return { delivered: false, error: error.message, mode: "smtp-error" };
  }
};

/**
 * 5. Send admission status update notification (e.g. Enrolled, Accepted, Rejected).
 */
export const sendAdmissionStatusEmail = async ({
  to,
  firstName = "",
  status = "",
  program = "",
  yearLevel = "",
  remarks = "",
  loginUrl = process.env.CLIENT_URL || "http://localhost:5173",
}) => {
  if (!to || typeof to !== "string" || !to.includes("@")) {
    return { delivered: false, error: "Invalid recipient email address", mode: "validation-error" };
  }

  const from = getFromAddress("Nexus Admissions");
  const transporter = getTransporter();

  if (!transporter) {
    return { delivered: false, mode: "console-fallback" };
  }

  const isEnrolled = String(status).toLowerCase() === "enrolled" || String(status).toLowerCase() === "accepted";
  const badgeType = isEnrolled ? "success" : String(status).toLowerCase() === "rejected" ? "danger" : "warning";

  const detailsList = [
    { label: "Program Applied", value: program || "Academic Program" },
  ];

  if (yearLevel) {
    detailsList.push({ label: "Year Level", value: yearLevel });
  }

  detailsList.push({ label: "Updated Status", value: status, isBadge: true, badgeType });

  if (remarks) {
    detailsList.push({ label: "Official Remarks", value: remarks });
  }

  const html = renderUnifiedEmailHtml({
    headerTitle: "NexusERP Academic Portal",
    headerSubtitle: isEnrolled ? "Enrollment Confirmed" : "Admission Status Update",
    greetingName: firstName,
    introMessage: isEnrolled
      ? `Congratulations! Your admission has been approved and your official enrollment${program ? ` for <strong>${escapeHtml(program)}</strong>` : ""} is confirmed.`
      : `Your admission application status${program ? ` for <strong>${escapeHtml(program)}</strong>` : ""} has been updated to <strong>${escapeHtml(status)}</strong>.`,
    details: detailsList,
    actionButton: {
      text: "Access Student Portal",
      url: loginUrl,
    },
    additionalNote:
      "Log in to your NexusERP student account to review your official records, class schedule, and enrollment details.",
    warningHtml:
      "If you have inquiries regarding this status update, please contact the Registrar or Admissions Office.",
  });

  const subject = isEnrolled
    ? `Nexus Admission - Enrollment Confirmed: ${program || "Academic Program"}`
    : `Nexus Admission Status: ${status}`;

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text: `Hello ${firstName}, your admission application status is now: ${status}.${remarks ? ` Remarks: ${remarks}` : ""}`,
      html,
    });
    return { delivered: true, mode: "smtp" };
  } catch (error) {
    console.error("⚠️ Failed to send admission status email via SMTP:", error.message);
    return { delivered: false, error: error.message, mode: "smtp-error" };
  }
};

/**
 * 6. Send enrollment application submitted notification.
 */
export const sendEnrollmentSubmittedEmail = async ({
  to,
  firstName = "",
  course = "",
  schoolYear = "",
  semester = "",
  loginUrl = process.env.CLIENT_URL || "http://localhost:5173",
}) => {
  const from = getFromAddress("Nexus Registrar");
  const transporter = getTransporter();

  if (!transporter) {
    return { delivered: false, mode: "console-fallback" };
  }

  const period = [schoolYear, semester].filter(Boolean).join(" - ");

  const html = renderUnifiedEmailHtml({
    headerTitle: "NexusERP Academic Portal",
    headerSubtitle: "Enrollment Confirmation",
    greetingName: firstName,
    introMessage:
      "Your course enrollment application has been recorded in the system. Your subject registrations are listed below.",
    details: [
      { label: "Course / Subject", value: course || "Course Registration" },
      { label: "Academic Term", value: period || "Current Term" },
      { label: "Enrollment Status", value: "Registered", isBadge: true, badgeType: "success" },
    ],
    actionButton: {
      text: "View My Schedule & Records",
      url: loginUrl,
    },
    additionalNote:
      "Please review your enrolled subject units and class schedule on your student portal.",
    warningHtml:
      "For schedule adjustments or section changes, please consult the Registrar's Office during the add/drop period.",
  });

  try {
    await transporter.sendMail({
      from,
      to,
      subject: "Nexus Enrollment Application Received",
      text: `Hello ${firstName}, your enrollment application${course ? ` for ${course}` : ""}${period ? ` (${period})` : ""} was submitted successfully.`,
      html,
    });
    return { delivered: true, mode: "smtp" };
  } catch (error) {
    console.error("⚠️ Failed to send enrollment submitted email via SMTP:", error.message);
    return { delivered: false, error: error.message, mode: "smtp-error" };
  }
};

export const sendAbsenteeAlertEmail = async ({
  to,
  firstName = "Student",
  course = "",
  absenceCount = 0,
  alertDate = "",
  message = "",
  senderName = "Faculty",
  senderEmail = "",
}) => {
  if (!to || typeof to !== "string" || !to.includes("@")) {
    return { delivered: false, error: "Invalid recipient email address", mode: "validation-error" };
  }

  const transporter = getTransporter();
  if (!transporter) return { delivered: false, mode: "smtp-unavailable" };

  // Keep the authenticated Hostinger mailbox as the actual sender address,
  // while showing the logged-in faculty member as the sender name.
  const fromAddress = String(process.env.SMTP_USER || "").trim();
  const from = { name: senderName, address: fromAddress };
  const safeCourse = escapeHtml(course || "your course");
  const safeMessage = escapeHtml(message || `Our records show ${absenceCount} absence(s).`);
  const html = renderUnifiedEmailHtml({
    headerTitle: "NexusERP Academic Portal",
    headerSubtitle: "Attendance Notice",
    greetingName: firstName,
    introMessage: `Please review this attendance notice for <strong>${safeCourse}</strong>.`,
    details: [
      { label: "Course", value: course || "N/A" },
      { label: "Attendance Status", value: "Absent", isBadge: true, badgeType: "danger" },
      { label: "Recorded Absences", value: absenceCount },
      ...(alertDate ? [{ label: "Alert Date", value: alertDate }] : []),
    ],
    alertBox: { type: "warning", title: "Attendance Alert", message: safeMessage },
    additionalNote: "Please contact your instructor or the school office if you believe this notice is incorrect.",
  });

  try {
    await transporter.sendMail({
      from,
      ...(senderEmail && senderEmail.includes("@") ? { replyTo: { name: senderName, address: senderEmail } } : {}),
      to,
      subject: `Nexus Attendance Notice${course ? `: ${course}` : ""}`,
      text: `Dear ${firstName},\n\n${message}\n\nRegards,\n${senderName}`,
      html,
    });
    return { delivered: true, mode: "smtp" };
  } catch (error) {
    console.error("Failed to send absentee alert email:", error.message);
    return { delivered: false, error: error.message, mode: "smtp-error" };
  }
};

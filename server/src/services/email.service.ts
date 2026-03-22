import nodemailer from "nodemailer";
import { logger } from "../logger.js";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const fromEmail = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@collabspace.io";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

const sendEmail = async (options: SendEmailOptions): Promise<{ success: boolean }> => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn("SMTP not configured, skipping email", { to: options.to, subject: options.subject });
    return { success: true };
  }

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    logger.info("Email sent", { to: options.to, subject: options.subject });
    return { success: true };
  } catch (err: any) {
    logger.error("Email send failed", { to: options.to, error: err.message });
    return { success: false };
  }
};

export const sendInvitationEmail = async (
  email: string,
  workspaceName: string,
  inviterName: string,
) => {
  const appUrl = process.env.CLIENT_URL ?? "http://localhost:3000";
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">CollabSpace</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;font-weight:600;">You've been invited!</h2>
          <p style="margin:0 0 24px;color:#52525b;font-size:15px;line-height:1.6;">
            <strong>${inviterName}</strong> has invited you to join
            <strong>${workspaceName}</strong> on CollabSpace.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="${appUrl}/onboarding" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:15px;font-weight:600;">
              Accept Invitation
            </a>
          </td></tr></table>
          <p style="margin:24px 0 0;color:#a1a1aa;font-size:13px;line-height:1.5;">
            If you don't have an account yet, you'll be able to create one when you click the button above.
          </p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #e4e4e7;text-align:center;">
          <p style="margin:0;color:#a1a1aa;font-size:12px;">CollabSpace — Collaborative workspace for teams</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to: email,
    subject: `${inviterName} invited you to ${workspaceName} on CollabSpace`,
    html,
  });
};

export const sendNotificationEmail = async (
  email: string,
  title: string,
  message: string,
  link: string,
) => {
  const appUrl = process.env.CLIENT_URL ?? "http://localhost:3000";
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#6366f1;padding:24px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;">CollabSpace</h1>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <h2 style="margin:0 0 12px;color:#18181b;font-size:18px;">${title}</h2>
          <p style="margin:0 0 20px;color:#52525b;font-size:14px;line-height:1.6;">${message}</p>
          <a href="${appUrl}${link}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:10px 24px;border-radius:6px;font-size:14px;font-weight:600;">View Details</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendEmail({ to: email, subject: title, html });
};

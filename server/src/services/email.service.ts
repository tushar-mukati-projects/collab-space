// Email service using Resend (or console fallback for development)
// Set RESEND_API_KEY env variable to enable real email sending

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

const sendWithResend = async (options: SendEmailOptions): Promise<{ success: boolean }> => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[Email] No RESEND_API_KEY set — logging email instead:");
    console.log(`  To: ${options.to}`);
    console.log(`  Subject: ${options.subject}`);
    console.log(`  Body: ${options.html.slice(0, 200)}...`);
    return { success: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? "CollabSpace <noreply@collabspace.io>",
      to: options.to,
      subject: options.subject,
      html: options.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[Email] Resend error:", res.status, body);
    return { success: false };
  }

  return { success: true };
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
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">CollabSpace</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;font-weight:600;">You've been invited!</h2>
              <p style="margin:0 0 24px;color:#52525b;font-size:15px;line-height:1.6;">
                <strong>${inviterName}</strong> has invited you to join the
                <strong>${workspaceName}</strong> workspace on CollabSpace.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/onboarding"
                       style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;color:#a1a1aa;font-size:13px;line-height:1.5;">
                If you don't have an account yet, you'll be able to create one when you click the button above.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e4e4e7;text-align:center;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;">
                CollabSpace — Collaborative workspace for teams
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendWithResend({
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
<head>
  <meta charset="utf-8">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#6366f1;padding:24px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;">CollabSpace</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <h2 style="margin:0 0 12px;color:#18181b;font-size:18px;">${title}</h2>
              <p style="margin:0 0 20px;color:#52525b;font-size:14px;line-height:1.6;">${message}</p>
              <a href="${appUrl}${link}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:10px 24px;border-radius:6px;font-size:14px;font-weight:600;">View Details</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendWithResend({ to: email, subject: title, html });
};

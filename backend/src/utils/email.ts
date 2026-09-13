import { Resend } from "resend";
import { logger } from "./logger";

function getResendClient(): Resend | null {
  const rawKey = process.env.RESEND_API_KEY || "";
  const sanitizedKey = rawKey.replace(/["']/g, "").trim();
  return sanitizedKey ? new Resend(sanitizedKey) : null;
}

const EMAIL_FROM = process.env.EMAIL_FROM || "Evently <onboarding@resend.dev>";
const APP_URL = process.env.APP_URL || "http://localhost:5173";

export interface SendVerificationEmailOptions {
  to: string;
  name: string;
  token: string;
}

export async function sendVerificationEmail({ to, name, token }: SendVerificationEmailOptions): Promise<{
  success: boolean;
  url: string;
  error?: string;
}> {
  const verificationUrl = `${APP_URL}/verify-email?token=${encodeURIComponent(token)}`;
  const resend = getResendClient();

  // Always log verification link in development for smooth local testing
  logger.info(`📧 [Email Verification] Recipient: ${to} (${name}) | Link: ${verificationUrl}`);
  if (!resend) {
    logger.warn(`⚠️  RESEND_API_KEY is not configured in .env. Falling back to console link above.`);
  }

  if (!resend) {
    return { success: false, url: verificationUrl, error: "RESEND_API_KEY not configured" };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your email</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 24px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin: 0 auto;">
          <tr>
            <td style="padding: 32px 32px 24px; text-align: left;">
              <div style="display: inline-block; background-color: #ef4444; color: #ffffff; width: 36px; height: 36px; border-radius: 8px; text-align: center; line-height: 36px; font-size: 20px; font-weight: bold; margin-right: 8px; vertical-align: middle;">
                ✦
              </div>
              <span style="font-size: 22px; font-weight: bold; color: #111827; vertical-align: middle; letter-spacing: -0.5px;">
                Event<span style="color: #ef4444;">ly</span>
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 24px;">
              <h1 style="font-size: 20px; font-weight: 600; color: #111827; margin: 0 0 16px;">
                Verify your email address
              </h1>
              <p style="font-size: 15px; color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
                Hi <strong>${escapeHtml(name)}</strong>,
              </p>
              <p style="font-size: 15px; color: #4b5563; line-height: 1.6; margin: 0 0 24px;">
                Thanks for getting started with Evently! Please click the button below to verify your email address and activate your account.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${verificationUrl}" target="_blank" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 12px 32px; border-radius: 8px;">
                  Verify Email Address
                </a>
              </div>
              <p style="font-size: 13px; color: #6b7280; line-height: 1.5; margin: 24px 0 8px;">
                Or copy and paste this URL into your browser:
              </p>
              <p style="font-size: 12px; color: #ef4444; word-break: break-all; background-color: #fef2f2; padding: 10px; border-radius: 6px; margin: 0 0 24px;">
                ${verificationUrl}
              </p>
              <p style="font-size: 13px; color: #9ca3af; margin: 0;">
                This link will expire in 24 hours. If you did not create an Evently account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 32px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                © ${new Date().getFullYear()} Evently. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: "Verify your email address - Evently",
      html: htmlContent,
    });

    if (error) {
      logger.error(`[Resend Delivery Failed]: ${error.message || error}`);
      if (error.message && error.message.includes("only send testing emails to your own email address")) {
        logger.warn("[Sandbox Tip]: On free Resend accounts without a custom domain, you can only deliver to your Resend account email address. Use the verification URL printed above for testing other accounts!");
      }
      return { success: false, url: verificationUrl, error: error.message };
    }

    logger.info(`[Resend Delivery Succeeded] Email dispatched via Resend! ID: ${data?.id}`);
    return { success: true, url: verificationUrl };
  } catch (err: any) {
    logger.error(`[Resend Exception]:`, err);
    return { success: false, url: verificationUrl, error: err?.message || "Failed to send email" };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


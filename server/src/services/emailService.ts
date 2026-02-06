import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

const APP_ID = 'regionify';
const APP_NAME = 'Regionify';

// Brand colors - keep in sync with client theme
const COLORS = {
  primary: '#1890ff',
  primaryDark: '#096dd9',
  textDark: '#262626',
  textLight: '#595959',
  textMuted: '#8c8c8c',
  background: '#f5f5f5',
  white: '#ffffff',
  border: '#e8e8e8',
  success: '#52c41a',
};

interface MailApiResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

interface MailApiErrorResponse {
  success: false;
  error: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Base email layout wrapper with responsive design and email client compatibility
 */
function emailLayout(content: string, preheader?: string): string {
  // Preheader is the preview text shown in email clients
  const preheaderHtml = preheader
    ? `<div style="display:none;font-size:1px;color:#f5f5f5;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>`
    : '';

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>${APP_NAME}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    /* Button hover - for clients that support it */
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .mobile-padding { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  ${preheaderHtml}
  
  <!-- Email wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${COLORS.background};">
    <tr>
      <td style="padding: 40px 20px;">
        
        <!-- Email container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="margin: 0 auto; background-color: ${COLORS.white}; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px 24px 40px; text-align: center; border-bottom: 1px solid ${COLORS.border};">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: ${COLORS.primary}; letter-spacing: -0.5px;">
                ${APP_NAME}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="mobile-padding" style="padding: 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: ${COLORS.background}; border-radius: 0 0 8px 8px; border-top: 1px solid ${COLORS.border};">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; color: ${COLORS.textMuted}; font-size: 13px; line-height: 20px;">
                    <p style="margin: 0 0 8px 0;">
                      &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                    </p>
                    <p style="margin: 0;">
                      Create beautiful data visualizations for your regions.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

/**
 * Creates a styled button for email
 */
function emailButton(text: string, url: string): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
  <tr>
    <td style="border-radius: 6px; background-color: ${COLORS.primary};">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="13%" strokecolor="${COLORS.primary}" fillcolor="${COLORS.primary}">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:600;">${text}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: ${COLORS.white}; text-decoration: none; border-radius: 6px; background-color: ${COLORS.primary};">${text}</a>
      <!--<![endif]-->
    </td>
  </tr>
</table>
`.trim();
}

/**
 * Creates a styled heading
 */
function emailHeading(text: string): string {
  return `<h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: ${COLORS.textDark}; line-height: 32px;">${text}</h2>`;
}

/**
 * Creates a styled paragraph
 */
function emailParagraph(text: string): string {
  return `<p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: ${COLORS.textLight};">${text}</p>`;
}

/**
 * Creates a muted/small text
 */
function emailMuted(text: string): string {
  return `<p style="margin: 16px 0 0 0; font-size: 14px; line-height: 22px; color: ${COLORS.textMuted};">${text}</p>`;
}

/**
 * Creates a divider
 */
function emailDivider(): string {
  return `<hr style="margin: 24px 0; border: none; border-top: 1px solid ${COLORS.border};">`;
}

// =============================================================================
// EMAIL TEMPLATES
// =============================================================================

export const emailTemplates = {
  /**
   * Welcome email sent after registration
   */
  welcome(name: string): { subject: string; text: string; html: string } {
    const subject = `Welcome to ${APP_NAME}!`;

    const text = `
Welcome to ${APP_NAME}, ${name}!

Thank you for creating an account. We're excited to have you on board.

With ${APP_NAME}, you can create stunning data visualizations for regions around the world. Get started by visiting your dashboard.

If you have any questions, feel free to reach out to our support team.

Best regards,
The ${APP_NAME} Team
`.trim();

    const html = emailLayout(
      `
        ${emailHeading(`Welcome, ${name}!`)}
        ${emailParagraph(`Thank you for creating an account. We're excited to have you on board.`)}
        ${emailParagraph(`With <strong>${APP_NAME}</strong>, you can create stunning data visualizations for regions around the world.`)}
        ${emailButton('Get Started', `${env.CLIENT_URL}/visualizer`)}
        ${emailMuted(`If you have any questions, feel free to reach out to our support team.`)}
      `,
      `Welcome to ${APP_NAME}! Start creating beautiful visualizations today.`,
    );

    return { subject, text, html };
  },

  /**
   * Password reset request email
   */
  passwordReset(
    name: string,
    resetUrl: string,
    expiresInMinutes: number,
  ): { subject: string; text: string; html: string } {
    const subject = `Reset Your ${APP_NAME} Password`;

    const text = `
Hi ${name},

We received a request to reset your password for your ${APP_NAME} account.

Click the link below to reset your password:
${resetUrl}

This link will expire in ${expiresInMinutes} minutes.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

Best regards,
The ${APP_NAME} Team
`.trim();

    const html = emailLayout(
      `
        ${emailHeading('Reset Your Password')}
        ${emailParagraph(`Hi ${name},`)}
        ${emailParagraph(`We received a request to reset your password for your ${APP_NAME} account. Click the button below to create a new password.`)}
        ${emailButton('Reset Password', resetUrl)}
        ${emailMuted(`This link will expire in <strong>${expiresInMinutes} minutes</strong>.`)}
        ${emailDivider()}
        ${emailMuted(`If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.`)}
        ${emailMuted(`Or copy this link: <a href="${resetUrl}" style="color: ${COLORS.primary}; word-break: break-all;">${resetUrl}</a>`)}
      `,
      `Reset your ${APP_NAME} password. This link expires in ${expiresInMinutes} minutes.`,
    );

    return { subject, text, html };
  },

  /**
   * Password changed confirmation email
   */
  passwordChanged(name: string): { subject: string; text: string; html: string } {
    const subject = `Your ${APP_NAME} Password Was Changed`;

    const text = `
Hi ${name},

Your ${APP_NAME} password was successfully changed.

If you made this change, you can safely ignore this email.

If you didn't change your password, please contact our support team immediately or reset your password.

Best regards,
The ${APP_NAME} Team
`.trim();

    const html = emailLayout(
      `
        ${emailHeading('Password Changed Successfully')}
        ${emailParagraph(`Hi ${name},`)}
        ${emailParagraph(`Your ${APP_NAME} password was successfully changed.`)}
        ${emailParagraph(`If you made this change, no further action is needed.`)}
        ${emailDivider()}
        ${emailMuted(`If you didn't make this change, please <a href="${env.CLIENT_URL}/forgot-password" style="color: ${COLORS.primary};">reset your password</a> immediately or contact our support team.`)}
      `,
      `Your ${APP_NAME} password was changed successfully.`,
    );

    return { subject, text, html };
  },

  /**
   * Email verification (for future use)
   */
  verifyEmail(name: string, verifyUrl: string): { subject: string; text: string; html: string } {
    const subject = `Verify Your ${APP_NAME} Email`;

    const text = `
Hi ${name},

Please verify your email address by clicking the link below:
${verifyUrl}

If you didn't create an account with ${APP_NAME}, you can safely ignore this email.

Best regards,
The ${APP_NAME} Team
`.trim();

    const html = emailLayout(
      `
        ${emailHeading('Verify Your Email')}
        ${emailParagraph(`Hi ${name},`)}
        ${emailParagraph(`Please verify your email address to complete your registration and unlock all features.`)}
        ${emailButton('Verify Email', verifyUrl)}
        ${emailDivider()}
        ${emailMuted(`If you didn't create an account with ${APP_NAME}, you can safely ignore this email.`)}
        ${emailMuted(`Or copy this link: <a href="${verifyUrl}" style="color: ${COLORS.primary}; word-break: break-all;">${verifyUrl}</a>`)}
      `,
      `Verify your email to complete your ${APP_NAME} registration.`,
    );

    return { subject, text, html };
  },
};

// =============================================================================
// EMAIL SERVICE
// =============================================================================

export const emailService = {
  /**
   * Send an email using the external mail API
   */
  async send({
    to,
    subject,
    text,
    html,
  }: SendEmailParams): Promise<{ success: boolean; messageId?: string }> {
    const payload = {
      appId: APP_ID,
      to,
      subject,
      text,
      html,
    };

    try {
      const response = await fetch(`${env.MAIL_API_URL}/mail/external/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(env.MAIL_API_KEY && { 'x-api-key': env.MAIL_API_KEY }),
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as MailApiResponse | MailApiErrorResponse;

      if (!response.ok || !data.success) {
        const errorMessage = 'error' in data ? data.error : 'Failed to send email';
        logger.error({ response: data, statusCode: response.status }, 'Mail API error');
        throw new Error(errorMessage);
      }

      logger.info(
        { to, subject, messageId: (data as MailApiResponse).messageId },
        'Email sent successfully',
      );

      return {
        success: true,
        messageId: (data as MailApiResponse).messageId,
      };
    } catch (error) {
      logger.error({ error, to, subject }, 'Failed to send email');
      throw error;
    }
  },

  /**
   * Send welcome email after registration
   */
  async sendWelcome(to: string, name: string): Promise<void> {
    const { subject, text, html } = emailTemplates.welcome(name);
    await this.send({ to, subject, text, html });
  },

  /**
   * Send password reset email
   */
  async sendPasswordReset(to: string, name: string, resetToken: string): Promise<void> {
    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;
    const expiresInMinutes = 60; // 1 hour
    const { subject, text, html } = emailTemplates.passwordReset(name, resetUrl, expiresInMinutes);
    await this.send({ to, subject, text, html });
  },

  /**
   * Send password changed confirmation
   */
  async sendPasswordChanged(to: string, name: string): Promise<void> {
    const { subject, text, html } = emailTemplates.passwordChanged(name);
    await this.send({ to, subject, text, html });
  },

  /**
   * Send email verification
   */
  async sendVerifyEmail(to: string, name: string, verifyToken: string): Promise<void> {
    const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${verifyToken}`;
    const { subject, text, html } = emailTemplates.verifyEmail(name, verifyUrl);
    await this.send({ to, subject, text, html });
  },
};

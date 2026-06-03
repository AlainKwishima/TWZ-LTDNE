import {
  BrevoEmailClient,
  getBrevoEmailClient,
  isDevEmailFallbackAllowed,
} from '@fems/shared';

function getFrontendUrl(): string {
  const url = process.env.FRONTEND_URL?.trim() || 'http://localhost:5173';
  return url.replace(/\/$/, '');
}

function buildPasswordResetLink(resetToken: string): string {
  return `${getFrontendUrl()}/reset-password?token=${encodeURIComponent(resetToken)}`;
}

export class EmailService {
  private readonly brevo: BrevoEmailClient;
  private readyPromise: Promise<void> | null = null;

  constructor(brevo: BrevoEmailClient = getBrevoEmailClient()) {
    this.brevo = brevo;
  }

  async ensureReady(): Promise<void> {
    if (this.readyPromise) {
      return this.readyPromise;
    }

    this.readyPromise = (async () => {
      if (!this.brevo.isConfigured()) {
        if (isDevEmailFallbackAllowed()) {
          console.warn(
            '[EmailService] Brevo not configured — development fallback will log OTP/password links to the console'
          );
          return;
        }
        throw new Error(
          'Brevo email is not configured. Set BREVO_API_KEY, BREVO_SENDER_EMAIL, and BREVO_SENDER_NAME.'
        );
      }

      const account = await this.brevo.verifyConnection();
      const sender = this.brevo.getSender();
      console.log(
        `[EmailService] Brevo ready — account ${account.email}, sending as "${sender?.name}" <${sender?.email}>`
      );
    })().catch((error) => {
      this.readyPromise = null;
      throw error;
    });

    return this.readyPromise;
  }

  isConfigured(): boolean {
    return this.brevo.isConfigured();
  }

  async sendOtpEmail(to: string, otpCode: string, purpose: string): Promise<void> {
    const subject = 'Your TWZ LTD verification code';
    const text = `Your verification code for ${purpose} is: ${otpCode}\n\nThis code expires in 10 minutes. Do not share it with anyone.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #2563eb;">TWZ LTD</h2>
        <p>Your verification code for <strong>${purpose}</strong> is:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #1f2937;">${otpCode}</p>
        <p style="color: #6b7280; font-size: 14px;">This code expires in 10 minutes. Do not share it with anyone.</p>
      </div>
    `;

    await this.deliver(to, subject, text, html, ['otp', purpose]);
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const resetLink = buildPasswordResetLink(resetToken);
    const subject = 'Reset your TWZ LTD password';
    const text = [
      'We received a request to reset your TWZ LTD password.',
      '',
      'Open this link to choose a new password (valid for 1 hour):',
      resetLink,
      '',
      'If you did not request this, you can ignore this email.',
    ].join('\n');
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #2563eb;">Reset your password</h2>
        <p>We received a request to reset your TWZ LTD account password.</p>
        <p style="margin: 24px 0;">
          <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: bold;">
            Reset password
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">This link expires in 1 hour. If the button does not work, copy and paste this URL into your browser:</p>
        <p style="font-size: 13px; word-break: break-all; color: #374151;">${resetLink}</p>
        <p style="color: #6b7280; font-size: 14px;">If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `;

    await this.deliver(to, subject, text, html, ['password-reset']);
  }

  private async deliver(
    to: string,
    subject: string,
    text: string,
    html: string,
    tags: string[]
  ): Promise<void> {
    if (!this.brevo.isConfigured()) {
      if (isDevEmailFallbackAllowed()) {
        console.log(`[EmailService] DEV email to ${to}`);
        console.log(`  Subject: ${subject}`);
        console.log(`  Body:\n${text}`);
        return;
      }
      throw new Error('Brevo email is not configured.');
    }

    await this.brevo.send({ to, subject, text, html, tags });
  }
}

export const emailService = new EmailService();

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

  async sendInspectorAppointmentEmail(input: {
    to: string;
    fullName: string;
    institutionName: string;
  }): Promise<void> {
    const loginUrl = `${getFrontendUrl()}/login`;
    const dashboardUrl = `${getFrontendUrl()}/inspector/dashboard`;
    const subject = `You have been appointed as an Inspector — ${input.institutionName}`;
    const text = [
      `Dear ${input.fullName},`,
      '',
      `The administration of ${input.institutionName} has appointed you to serve as an Inspector on the Fire Extinguisher Management System.`,
      '',
      'Your account role: Inspector',
      '',
      'As an Inspector you can:',
      '- Sign in to the inspector portal',
      '- View assigned maintenance requests',
      '- Update request status and complete field work',
      '- Access asset information relevant to your assignments',
      '',
      'Next steps:',
      `1. Sign in at ${loginUrl}`,
      `2. Open your dashboard at ${dashboardUrl}`,
      '3. Review any maintenance requests already assigned to you',
      '',
      'If you did not expect this appointment, contact your system administrator.',
      '',
      `— ${input.institutionName} Administration`,
    ].join('\n');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #2563eb;">Inspector appointment</h2>
        <p>Dear <strong>${input.fullName}</strong>,</p>
        <p>
          The administration of <strong>${input.institutionName}</strong> has appointed you to serve as an
          <strong>Inspector</strong> on the Fire Extinguisher Management System.
        </p>
        <p style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 12px 16px; margin: 20px 0;">
          <strong>Your new role:</strong> Inspector
        </p>
        <p><strong>What you can do:</strong></p>
        <ul style="padding-left: 20px; line-height: 1.6;">
          <li>Sign in to the inspector portal</li>
          <li>View and work on maintenance requests assigned to you</li>
          <li>Update request status and record completion details</li>
          <li>Access asset information for your field assignments</li>
        </ul>
        <p><strong>Next steps:</strong></p>
        <ol style="padding-left: 20px; line-height: 1.6;">
          <li>Sign in with your registered email address</li>
          <li>Open your inspector dashboard</li>
          <li>Review any requests waiting for your action</li>
        </ol>
        <p style="margin: 28px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; margin-right: 8px;">
            Sign in
          </a>
          <a href="${dashboardUrl}" style="display: inline-block; background: #ffffff; color: #2563eb; text-decoration: none; padding: 11px 18px; border-radius: 8px; font-weight: bold; border: 2px solid #2563eb;">
            Inspector dashboard
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          If you did not expect this appointment, please contact your system administrator.
        </p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">— ${input.institutionName} Administration</p>
      </div>
    `;

    await this.deliver(input.to, subject, text, html, ['inspector-appointment', 'role-change']);
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

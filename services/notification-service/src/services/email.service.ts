import {
  BrevoEmailClient,
  getBrevoEmailClient,
  isDevEmailFallbackAllowed,
  type SendEmailResult,
} from '@fems/shared';

export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
  tags?: string[];
}

export class EmailService {
  private readonly brevo: BrevoEmailClient;

  constructor(brevo: BrevoEmailClient = getBrevoEmailClient()) {
    this.brevo = brevo;
  }

  isConfigured(): boolean {
    return this.brevo.isConfigured();
  }

  async ensureReady(): Promise<void> {
    if (!this.brevo.isConfigured()) {
      if (isDevEmailFallbackAllowed()) {
        console.warn('[EmailService] Brevo not configured — notification emails will be logged in development');
        return;
      }
      throw new Error(
        'Brevo email is not configured. Set BREVO_API_KEY, BREVO_SENDER_EMAIL, and BREVO_SENDER_NAME.'
      );
    }
    await this.brevo.verifyConnection();
    const sender = this.brevo.getSender();
    console.log(`[EmailService] Brevo ready — sender "${sender?.name}" <${sender?.email}>`);
  }

  async send(payload: EmailPayload): Promise<{ messageId: string; preview?: string; deliveredTo: string }> {
    if (!this.brevo.isConfigured()) {
      if (isDevEmailFallbackAllowed()) {
        const preview = `[DEV] To: ${payload.to}\nSubject: ${payload.subject}\n\n${payload.text}`;
        console.log(`[EmailService] ${preview}`);
        return { messageId: 'dev-fallback', preview, deliveredTo: payload.to };
      }
      throw new Error('Brevo email is not configured.');
    }

    const result: SendEmailResult = await this.brevo.send({
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      tags: payload.tags ?? ['notification'],
    });

    return {
      messageId: result.messageId,
      deliveredTo: result.deliveredTo,
    };
  }
}

/**
 * Brevo (formerly Sendinblue) transactional email client.
 * @see https://developers.brevo.com/reference/sendtransacemail
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_ACCOUNT_URL = 'https://api.brevo.com/v3/account';

export interface BrevoSender {
  email: string;
  name: string;
}

export interface SendEmailInput {
  to: string;
  toName?: string;
  subject: string;
  text: string;
  html?: string;
  tags?: string[];
}

export interface SendEmailResult {
  messageId: string;
  provider: 'brevo';
  /** When EMAIL_REDIRECT_TO is set, the address that actually received the message */
  deliveredTo: string;
}

export interface BrevoEmailConfig {
  apiKey: string | null;
  sender: BrevoSender | null;
  enabled: boolean;
  redirectTo: string | null;
  maxAttempts: number;
  baseDelayMs: number;
}

export class BrevoApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly body?: unknown
  ) {
    super(message);
    this.name = 'BrevoApiError';
  }
}

function trim(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v || undefined;
}

function parseSenderFromEnv(): BrevoSender | null {
  const email = trim(process.env.BREVO_SENDER_EMAIL);
  if (!email || !email.includes('@')) {
    return null;
  }

  const name =
    trim(process.env.BREVO_SENDER_NAME) ||
    trim(process.env.EMAIL_FROM)?.replace(/[<>]/g, '').trim() ||
    'TWZ LTD';

  return { email, name };
}

export function loadBrevoEmailConfig(): BrevoEmailConfig {
  const apiKey = trim(process.env.BREVO_API_KEY) ?? null;
  const sender = parseSenderFromEnv();
  const enabledFlag = trim(process.env.EMAIL_ENABLED)?.toLowerCase();
  const enabled =
    enabledFlag === 'false' ? false : enabledFlag === 'true' ? true : Boolean(apiKey && sender);

  return {
    apiKey,
    sender,
    enabled,
    redirectTo: trim(process.env.EMAIL_REDIRECT_TO) ?? null,
    maxAttempts: Math.max(1, parseInt(process.env.BREVO_RETRY_MAX_ATTEMPTS || '3', 10)),
    baseDelayMs: Math.max(100, parseInt(process.env.BREVO_RETRY_BASE_DELAY_MS || '1000', 10)),
  };
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class BrevoEmailClient {
  private readonly config: BrevoEmailConfig;

  constructor(config: BrevoEmailConfig = loadBrevoEmailConfig()) {
    this.config = config;
  }

  isConfigured(): boolean {
    return Boolean(this.config.enabled && this.config.apiKey && this.config.sender);
  }

  getSender(): BrevoSender | null {
    return this.config.sender;
  }

  /**
   * Validates API key against Brevo account endpoint.
   */
  async verifyConnection(): Promise<{ ok: true; email: string; companyName?: string }> {
    if (!this.config.apiKey) {
      throw new Error('BREVO_API_KEY is not set.');
    }

    const response = await fetch(BREVO_ACCOUNT_URL, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'api-key': this.config.apiKey,
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new BrevoApiError(
        `Brevo account verification failed (${response.status})`,
        response.status,
        body
      );
    }

    const data = (await response.json()) as { email?: string; companyName?: string };
    return { ok: true, email: data.email ?? 'unknown', companyName: data.companyName };
  }

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    if (!this.config.enabled) {
      throw new Error('Email delivery is disabled (EMAIL_ENABLED=false).');
    }

    if (!this.config.apiKey || !this.config.sender) {
      throw new Error(
        'Brevo is not configured. Set BREVO_API_KEY, BREVO_SENDER_EMAIL, and BREVO_SENDER_NAME.'
      );
    }

    const recipient = this.config.redirectTo ?? input.to;
    if (this.config.redirectTo && this.config.redirectTo !== input.to) {
      console.warn(
        `[BrevoEmailClient] EMAIL_REDIRECT_TO active — sending to ${recipient} instead of ${input.to}`
      );
    }

    const payload = {
      sender: this.config.sender,
      to: [{ email: recipient, name: input.toName || recipient }],
      subject: input.subject,
      textContent: input.text,
      htmlContent: input.html ?? input.text,
      tags: input.tags,
    };

    const messageId = await this.sendWithRetry(payload);
    console.log(
      `[BrevoEmailClient] Sent "${input.subject}" to ${recipient} (messageId=${messageId})`
    );

    return {
      messageId,
      provider: 'brevo',
      deliveredTo: recipient,
    };
  }

  private async sendWithRetry(payload: Record<string, unknown>): Promise<string> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await this.postEmail(payload);
      } catch (error) {
        lastError = error;
        const retryable =
          error instanceof BrevoApiError && isRetryableStatus(error.statusCode);
        if (!retryable || attempt >= this.config.maxAttempts) {
          break;
        }
        const delay = this.config.baseDelayMs * attempt;
        console.warn(
          `[BrevoEmailClient] Attempt ${attempt} failed (${error instanceof Error ? error.message : error}); retrying in ${delay}ms`
        );
        await sleep(delay);
      }
    }

    const message =
      lastError instanceof Error ? lastError.message : 'Unknown Brevo send error';
    throw new Error(`Failed to send email via Brevo: ${message}`);
  }

  private async postEmail(payload: Record<string, unknown>): Promise<string> {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': this.config.apiKey!,
      },
      body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      const detail =
        typeof body === 'object' && body !== null && 'message' in body
          ? String((body as { message: string }).message)
          : response.statusText;
      throw new BrevoApiError(
        detail || `Brevo API error ${response.status}`,
        response.status,
        body
      );
    }

    const messageId =
      typeof body === 'object' && body !== null && 'messageId' in body
        ? String((body as { messageId: string }).messageId)
        : 'unknown';

    return messageId;
  }
}

/** Singleton for services that import a shared client instance */
let defaultClient: BrevoEmailClient | null = null;

export function getBrevoEmailClient(): BrevoEmailClient {
  if (!defaultClient) {
    defaultClient = new BrevoEmailClient();
  }
  return defaultClient;
}

export function isDevEmailFallbackAllowed(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.EMAIL_DEV_FALLBACK !== 'false';
}

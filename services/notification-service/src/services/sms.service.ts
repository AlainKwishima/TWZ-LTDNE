export interface SmsPayload {
  to: string;
  body: string;
}

export interface SmsResult {
  provider: string;
  messageId: string;
  status: 'queued' | 'sent' | 'stub';
  detail?: string;
}

/**
 * SMS delivery layer with provider stubs for Twilio and Africa's Talking.
 * Set SMS_PROVIDER=twilio|africastalking|stub (default: stub).
 */
export class SmsService {
  private provider = (process.env.SMS_PROVIDER || 'stub').toLowerCase();

  async send(payload: SmsPayload): Promise<SmsResult> {
    switch (this.provider) {
      case 'twilio':
        return this.sendViaTwilio(payload);
      case 'africastalking':
        return this.sendViaAfricasTalking(payload);
      default:
        return this.sendStub(payload);
    }
  }

  private async sendViaTwilio(payload: SmsPayload): Promise<SmsResult> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;

    if (!accountSid || !authToken || !from) {
      console.warn('[SmsService] Twilio credentials missing – falling back to stub');
      return this.sendStub(payload);
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const body = new URLSearchParams({ To: payload.to, From: from, Body: payload.body });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Twilio SMS failed: ${response.status} ${text}`);
    }

    const data = (await response.json()) as { sid: string; status: string };
    return {
      provider: 'twilio',
      messageId: data.sid,
      status: 'queued',
      detail: data.status,
    };
  }

  private async sendViaAfricasTalking(payload: SmsPayload): Promise<SmsResult> {
    const apiKey = process.env.AFRICASTALKING_API_KEY;
    const username = process.env.AFRICASTALKING_USERNAME;

    if (!apiKey || !username) {
      console.warn('[SmsService] Africa\'s Talking credentials missing – falling back to stub');
      return this.sendStub(payload);
    }

    const response = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username,
        to: payload.to,
        message: payload.body,
      }).toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Africa's Talking SMS failed: ${response.status} ${text}`);
    }

    const data = (await response.json()) as {
      SMSMessageData?: { Recipients?: Array<{ messageId: string; status: string }> };
    };
    const recipient = data.SMSMessageData?.Recipients?.[0];

    return {
      provider: 'africastalking',
      messageId: recipient?.messageId || `at-${Date.now()}`,
      status: 'queued',
      detail: recipient?.status,
    };
  }

  private async sendStub(payload: SmsPayload): Promise<SmsResult> {
    console.log(`[SmsService:stub] SMS to ${payload.to}: ${payload.body.slice(0, 80)}...`);
    return {
      provider: 'stub',
      messageId: `stub-${Date.now()}`,
      status: 'stub',
      detail: 'SMS logged locally (stub provider)',
    };
  }
}

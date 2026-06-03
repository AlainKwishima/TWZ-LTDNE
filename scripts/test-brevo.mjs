/**
 * Verify Brevo configuration and send a test transactional email.
 *
 * Usage (from repo root):
 *   npm run build -w @fems/shared
 *   npm run test:email
 *
 * Loads, in order: .env, services/auth-service/.env, services/notification-service/.env
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(root, '.env'));
loadEnvFile(resolve(root, 'services/auth-service/.env'));
loadEnvFile(resolve(root, 'services/notification-service/.env'));

const { BrevoEmailClient, loadBrevoEmailConfig } = await import('../packages/shared/dist/email/brevo.js');

const config = loadBrevoEmailConfig();
const recipient =
  process.env.BREVO_TEST_RECIPIENT?.trim() ||
  process.env.EMAIL_REDIRECT_TO?.trim();

if (!config.apiKey || !config.sender) {
  console.error('Missing BREVO_API_KEY or BREVO_SENDER_EMAIL (and verified sender in Brevo).');
  console.error('Copy .env.example to .env and set Brevo variables.');
  process.exit(1);
}

if (!recipient) {
  console.error('Set BREVO_TEST_RECIPIENT (or EMAIL_REDIRECT_TO) to the inbox that should receive the test.');
  process.exit(1);
}

const client = new BrevoEmailClient(config);

console.log('Verifying Brevo API key...');
const account = await client.verifyConnection();
console.log(`  Account: ${account.email}${account.companyName ? ` (${account.companyName})` : ''}`);
console.log(`  Sender: "${config.sender.name}" <${config.sender.email}>`);
console.log(`  Test recipient: ${recipient}`);

const result = await client.send({
  to: recipient,
  subject: 'TWZ LTD Brevo integration test',
  text: [
    'This is a test message from the Fire Extinguisher Management System.',
    '',
    `Sent at: ${new Date().toISOString()}`,
    `Environment: ${process.env.NODE_ENV || 'development'}`,
  ].join('\n'),
  html: `<p>This is a <strong>TWZ LTD</strong> Brevo integration test.</p><p>Sent at: ${new Date().toISOString()}</p>`,
  tags: ['test', 'twz-ltd'],
});

console.log('\nSuccess.');
console.log(`  messageId: ${result.messageId}`);
console.log(`  deliveredTo: ${result.deliveredTo}`);
console.log('\nCheck the recipient inbox (and spam folder) to confirm delivery.');

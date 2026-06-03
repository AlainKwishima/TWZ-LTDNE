/**
 * Propagate root .env values into per-service .env files (never committed).
 * Run from repo root: node scripts/sync-service-env.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(root, '.env');

if (!existsSync(envPath)) {
  console.error('Missing root .env — copy .env.example to .env and configure secrets first.');
  process.exit(1);
}

function parseEnv(content) {
  const map = {};
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
    map[key] = value;
  }
  return map;
}

const env = parseEnv(readFileSync(envPath, 'utf8'));

function requireKey(key) {
  const v = env[key];
  if (!v) {
    console.warn(`[sync-env] Warning: ${key} is empty in root .env`);
  }
  return v ?? '';
}

const shared = {
  JWT_SECRET: requireKey('JWT_SECRET'),
  OTP_SECRET: requireKey('OTP_SECRET'),
  JWT_EXPIRES_IN: env.JWT_EXPIRES_IN || '24h',
  RABBITMQ_URL: env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  BREVO_API_KEY: requireKey('BREVO_API_KEY'),
  BREVO_SENDER_EMAIL: requireKey('BREVO_SENDER_EMAIL'),
  BREVO_SENDER_NAME: env.BREVO_SENDER_NAME || 'TWZ LTD',
  EMAIL_ENABLED: env.EMAIL_ENABLED ?? 'true',
  EMAIL_DEV_FALLBACK: env.EMAIL_DEV_FALLBACK ?? 'false',
  NODE_ENV: env.NODE_ENV || 'development',
  FRONTEND_URL: env.FRONTEND_URL || 'http://localhost:5173',
};

function writeServiceEnv(relPath, lines) {
  const path = resolve(root, relPath);
  const body = `${lines.filter(Boolean).join('\n')}\n`;
  writeFileSync(path, body, 'utf8');
  console.log(`[sync-env] Wrote ${relPath}`);
}

writeServiceEnv('apps/api-gateway/.env', [
  `PORT=${env.API_GATEWAY_PORT || '4000'}`,
  `JWT_SECRET=${shared.JWT_SECRET}`,
  `NODE_ENV=${shared.NODE_ENV}`,
  `FRONTEND_URL=${shared.FRONTEND_URL}`,
  `AUTH_SERVICE_URL=${env.AUTH_SERVICE_URL || 'http://localhost:4001'}`,
  `ASSET_SERVICE_URL=${env.ASSET_SERVICE_URL || 'http://localhost:4005'}`,
  `SERVICE_REQUEST_SERVICE_URL=${env.SERVICE_REQUEST_SERVICE_URL || 'http://localhost:4006'}`,
  `NOTIFICATION_SERVICE_URL=${env.NOTIFICATION_SERVICE_URL || 'http://localhost:4007'}`,
  `REPORTING_SERVICE_URL=${env.REPORTING_SERVICE_URL || 'http://localhost:4008'}`,
]);

writeServiceEnv('services/auth-service/.env', [
  'PORT=4001',
  `DATABASE_URL=${requireKey('AUTH_DATABASE_URL')}`,
  `JWT_SECRET=${shared.JWT_SECRET}`,
  `OTP_SECRET=${shared.OTP_SECRET}`,
  `JWT_EXPIRES_IN=${shared.JWT_EXPIRES_IN}`,
  `BREVO_API_KEY=${shared.BREVO_API_KEY}`,
  `BREVO_SENDER_EMAIL=${shared.BREVO_SENDER_EMAIL}`,
  `BREVO_SENDER_NAME=${shared.BREVO_SENDER_NAME}`,
  `EMAIL_ENABLED=${shared.EMAIL_ENABLED}`,
  `EMAIL_DEV_FALLBACK=${shared.EMAIL_DEV_FALLBACK}`,
  `FRONTEND_URL=${shared.FRONTEND_URL}`,
  `RABBITMQ_URL=${shared.RABBITMQ_URL}`,
  `LOGIN_REQUIRES_OTP=${env.LOGIN_REQUIRES_OTP || 'false'}`,
  env.GOOGLE_CLIENT_ID ? `GOOGLE_CLIENT_ID=${env.GOOGLE_CLIENT_ID}` : '',
]);

const dbServices = [
  ['services/asset-service/.env', '4005', 'ASSET_DATABASE_URL', true],
  ['services/service-request-service/.env', '4006', 'SERVICE_REQUEST_DATABASE_URL', true],
  ['services/notification-service/.env', '4007', 'NOTIFICATION_DATABASE_URL', true],
  ['services/reporting-service/.env', '4008', 'REPORTING_DATABASE_URL', true],
];

for (const [rel, port, dbKey, jwt] of dbServices) {
  const lines = [
    `PORT=${port}`,
    `DATABASE_URL=${requireKey(dbKey)}`,
    `RABBITMQ_URL=${shared.RABBITMQ_URL}`,
    `NODE_ENV=${shared.NODE_ENV}`,
  ];
  if (jwt) lines.push(`JWT_SECRET=${shared.JWT_SECRET}`);
  if (rel.includes('notification')) {
    lines.push(
      `BREVO_API_KEY=${shared.BREVO_API_KEY}`,
      `BREVO_SENDER_EMAIL=${shared.BREVO_SENDER_EMAIL}`,
      `BREVO_SENDER_NAME=${shared.BREVO_SENDER_NAME}`,
      `EMAIL_ENABLED=${shared.EMAIL_ENABLED}`,
      `CRON_SCHEDULE=${env.CRON_SCHEDULE || '0 8,20 * * *'}`,
      `COMPLIANCE_CRON_SCHEDULE=${env.COMPLIANCE_CRON_SCHEDULE || '0 9 * * *'}`,
      `EXPIRY_RUN_ON_STARTUP=${env.EXPIRY_RUN_ON_STARTUP ?? 'true'}`,
      `ASSET_SERVICE_URL=${env.ASSET_SERVICE_URL || 'http://localhost:4005'}`,
      `SERVICE_REQUEST_SERVICE_URL=${env.SERVICE_REQUEST_SERVICE_URL || 'http://localhost:4006'}`,
      `AUTH_SERVICE_URL=${env.AUTH_SERVICE_URL || 'http://localhost:4001'}`
    );
  }
  if (rel.includes('asset')) {
    lines.push(
      `NOTIFICATION_SERVICE_URL=${env.NOTIFICATION_SERVICE_URL || 'http://localhost:4007'}`,
      `AUTH_DATABASE_URL=${requireKey('AUTH_DATABASE_URL')}`,
      `DEMO_PORTAL_EMAIL=${env.DEMO_PORTAL_EMAIL || 'user@fems.local'}`
    );
  }
  if (rel.includes('reporting')) {
    lines.push(
      `AUTH_SERVICE_URL=${env.AUTH_SERVICE_URL || 'http://localhost:4001'}`,
      `ASSET_SERVICE_URL=${env.ASSET_SERVICE_URL || 'http://localhost:4005'}`,
      `SERVICE_REQUEST_SERVICE_URL=${env.SERVICE_REQUEST_SERVICE_URL || 'http://localhost:4006'}`,
      `NOTIFICATION_SERVICE_URL=${env.NOTIFICATION_SERVICE_URL || 'http://localhost:4007'}`
    );
  }
  if (rel.includes('service-request')) {
    lines.push(`ASSET_SERVICE_URL=${env.ASSET_SERVICE_URL || 'http://localhost:4005'}`);
  }
  writeServiceEnv(rel, lines);
}

console.log('[sync-env] Done. Restart services to pick up new environment.');

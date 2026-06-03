/**
 * Verify PostgreSQL and Brevo configuration (reads .env only; no secrets logged).
 * Usage: npm run verify:config
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(resolve(root, '.env'));

const checks = [];
function pass(name) {
  checks.push({ name, ok: true });
}
function fail(name, detail) {
  checks.push({ name, ok: false, detail });
}

if ((process.env.JWT_SECRET || '').length >= 32) pass('JWT_SECRET');
else fail('JWT_SECRET', 'min 32 characters required');

if ((process.env.OTP_SECRET || '').length >= 32) pass('OTP_SECRET');
else fail('OTP_SECRET', 'min 32 characters required');

const authUrl = process.env.AUTH_DATABASE_URL || '';
if (authUrl.startsWith('postgresql://')) pass('AUTH_DATABASE_URL format');
else fail('AUTH_DATABASE_URL', 'missing');

const pgPassword = process.env.POSTGRES_PASSWORD || '';
const pgHost = process.env.POSTGRES_HOST || 'localhost';
const pgPort = process.env.POSTGRES_PORT || '5432';

try {
  execSync('docker ps --filter name=fems-postgres --format "{{.Names}}"', {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const out = execSync('docker ps --filter name=fems-postgres --format "{{.Names}}"', {
    encoding: 'utf8',
  }).trim();
  if (out.includes('fems-postgres')) {
    execSync('docker exec fems-postgres pg_isready -U postgres', { stdio: 'pipe' });
    pass('PostgreSQL (Docker fems-postgres)');
    for (const db of [
      'auth_service_db',
      'asset_service_db',
      'service_request_service_db',
      'notification_service_db',
      'reporting_service_db',
    ]) {
      try {
        execSync(`docker exec -e PGPASSWORD=${pgPassword} fems-postgres psql -U postgres -d ${db} -c "SELECT 1"`, {
          stdio: 'pipe',
        });
        pass(`Database ${db}`);
      } catch {
        fail(`Database ${db}`, 'missing or unreachable — run docker/postgres/init.sql');
      }
    }
  } else {
    fail('PostgreSQL', 'fems-postgres container not running — run: docker compose up -d postgres');
  }
} catch {
  fail('PostgreSQL', 'Docker not available or postgres container not started');
}

if (process.env.BREVO_API_KEY?.startsWith('xkeysib-')) pass('BREVO_API_KEY format');
else fail('BREVO_API_KEY', 'set in .env (never commit)');

if (process.env.BREVO_SENDER_EMAIL?.includes('@')) pass('BREVO_SENDER_EMAIL');
else fail('BREVO_SENDER_EMAIL', 'verified sender required in Brevo');

try {
  const { BrevoEmailClient, loadBrevoEmailConfig } = await import('../packages/shared/dist/email/brevo.js');
  const config = loadBrevoEmailConfig();
  if (!config.apiKey || !config.sender) {
    fail('Brevo config', 'BREVO_API_KEY and BREVO_SENDER_EMAIL required');
  } else {
    const client = new BrevoEmailClient(config);
    await client.verifyConnection();
    pass('Brevo API account');
  }
} catch (err) {
  fail('Brevo API', err.message?.slice(0, 200) || 'validation failed');
}

try {
  const base = (process.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/api$/, '');
  const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(5000) });
  if (res.ok) pass('API gateway /health');
  else fail('API gateway', `HTTP ${res.status}`);
} catch {
  fail('API gateway', 'not running — npm run dev or docker compose up');
}

console.log('\nConfiguration verification:\n');
for (const c of checks) {
  console.log(`  ${c.ok ? '✓' : '✗'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`);
}
process.exit(checks.some((c) => !c.ok) ? 1 : 0);

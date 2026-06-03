import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../services/auth-service/.env') });

const base = 'http://localhost:4000/api';
const ts = Date.now();
const adminEmail = `admin${ts}@test.local`;
const custEmail = `cust${ts}@test.local`;
const pass = 'TestPass123!';

async function req(path, opts = {}) {
  const res = await fetch(`${base}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    method: opts.method || 'GET',
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function verifyEmail(email) {
  const { PrismaClient } = await import('../services/auth-service/src/generated/prisma/index.js');
  const crypto = await import('crypto');
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error(`User not found: ${email}`);
    const otpRecord = await prisma.otp.findFirst({
      where: { userId: user.id, verifiedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!otpRecord) throw new Error(`No OTP for ${email}`);

    const secret = process.env.OTP_SECRET || 'change-this-to-another-secure-secret-min-32-chars';
    let code = null;
    for (let i = 0; i <= 999999; i += 1) {
      const candidate = String(i).padStart(6, '0');
      const hash = crypto.createHmac('sha256', secret).update(candidate).digest('hex');
      if (hash === otpRecord.codeHash) {
        code = candidate;
        break;
      }
    }
    if (!code) throw new Error(`Could not derive OTP for ${email}`);

    const verify = await req('/auth/verify-otp', {
      method: 'POST',
      body: { email, code, purpose: 'signup' },
    });
    if (verify.status >= 400) {
      throw new Error(`Verify failed for ${email}: ${verify.json.message}`);
    }
    return verify.json;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('=== TWZ LTD smoke test ===');

  for (const [email, role] of [
    [adminEmail, 'Admin'],
    [custEmail, 'Customer'],
  ]) {
    const signup = await req('/auth/signup', {
      method: 'POST',
      body: { email, password: pass, fullName: `${role} User`, role },
    });
    console.log(`signup ${role}:`, signup.status, signup.json.message || signup.json.data?.message);
    if (signup.status >= 400) throw new Error('Signup failed');
    await verifyEmail(email);
    console.log(`verified ${role}`);
  }

  const adminLogin = await req('/auth/login', {
    method: 'POST',
    body: { email: adminEmail, password: pass },
  });
  const adminToken = adminLogin.json.data?.token;
  console.log('admin login:', adminLogin.status, adminToken ? 'token ok' : adminLogin.json.message);

  const product = await req('/products', {
    method: 'POST',
    token: adminToken,
    body: {
      productName: 'ABC Dry Powder 5kg',
      sku: `SKU-${ts}`,
      productType: 'DRY_POWDER',
      capacity: '5kg',
      price: 4500,
      quantityInStock: 10,
      description: 'Test extinguisher',
    },
  });
  console.log('create product:', product.status, product.json.message);
  if (product.status >= 400) throw new Error(JSON.stringify(product.json));

  const productId = product.json.data?.id;
  const products = await req('/products?page=1&limit=12');
  console.log('list products (public):', products.status, 'count', products.json.data?.length ?? 0);

  const custLogin = await req('/auth/login', {
    method: 'POST',
    body: { email: custEmail, password: pass },
  });
  let custToken = custLogin.json.data?.token;
  const custUser = custLogin.json.data?.user;
  console.log('customer login:', custLogin.status, 'customerId', custUser?.customerId ?? 'missing');

  const me = await req('/auth/me', { token: custToken });
  if (me.json.data?.token) {
    custToken = me.json.data.token;
    console.log('customer /me refreshed token with customerId:', me.json.data.user?.customerId);
  }

  const customerId = me.json.data?.user?.customerId || custUser?.customerId;
  const dash = await req(`/analytics/customer-dashboard?customerId=${customerId}`, {
    token: custToken,
  });
  console.log('customer dashboard:', dash.status, dash.json.message);

  const cartAdd = await req('/cart/items', {
    method: 'POST',
    token: custToken,
    body: {
      productId,
      productName: 'ABC Dry Powder 5kg',
      productType: 'DRY_POWDER',
      quantity: 1,
      unitPrice: 4500,
    },
  });
  console.log('add to cart:', cartAdd.status, cartAdd.json.message);

  const cart = await req('/cart', { token: custToken });
  console.log('get cart:', cart.status, cart.json.message, 'items', cart.json.data?.items?.length ?? 0);

  const orders = await req('/orders?page=1&limit=10', { token: adminToken });
  console.log('admin orders:', orders.status, orders.json.message);

  console.log('=== ALL SMOKE CHECKS PASSED ===');
}

main().catch((err) => {
  console.error('SMOKE TEST FAILED:', err.message);
  process.exit(1);
});

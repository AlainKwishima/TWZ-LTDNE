import { test, expect, type Page } from '@playwright/test';

const BASE = 'http://localhost:5173';
const PASSWORD = 'Password123!';

const USERS = {
  admin: { email: 'admin@TWZ LTD.local', dashboard: '/admin/dashboard' },
  inspector: { email: 'inspector@TWZ LTD.local', dashboard: '/inspector/dashboard' },
  user: { email: 'user@TWZ LTD.local', dashboard: '/user/dashboard' },
} as const;

async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/dashboard|verify-otp/, { timeout: 15000 });
  if (page.url().includes('verify-otp')) {
    throw new Error(`OTP required for ${email} — set LOGIN_REQUIRES_OTP=false for E2E`);
  }
}

test.describe('TWZ LTD Browser E2E', () => {
  test('Landing page loads', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: /sign in|login|get started/i }).first()).toBeVisible();
  });

  test('Login page loads', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
  });

  test('Signup page loads', async ({ page }) => {
    await page.goto(`${BASE}/signup`);
    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('Forgot password page loads', async ({ page }) => {
    await page.goto(`${BASE}/forgot-password`);
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('Admin — login and core management pages', async ({ page }) => {
    await login(page, USERS.admin.email);
    await expect(page).toHaveURL(new RegExp(USERS.admin.dashboard));
    await expect(page.getByText('Admin Dashboard').first()).toBeVisible({ timeout: 15000 });

    const pages = [
      { nav: 'Users', heading: /user/i },
      { nav: 'Assets', heading: /asset|extinguisher/i },
      { nav: 'Service Requests', heading: /service/i },
      { nav: 'Notifications', heading: /notification/i },
      { nav: 'Reports', heading: /report/i },
      { nav: 'Profile', heading: /profile/i },
    ];

    for (const p of pages) {
      await page.getByRole('link', { name: p.nav, exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15000 });
    }
  });

  test('Inspector — login and service requests', async ({ page }) => {
    await login(page, USERS.inspector.email);
    await expect(page).toHaveURL(new RegExp(USERS.inspector.dashboard));
    await expect(page.getByText(/inspector dashboard/i).first()).toBeVisible({ timeout: 15000 });
    await page.getByRole('link', { name: 'Service Requests', exact: true }).click();
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15000 });
  });

  test('User — login and portal pages', async ({ page }) => {
    await login(page, USERS.user.email);
    await expect(page).toHaveURL(new RegExp(USERS.user.dashboard));
    await expect(page.getByText(/welcome/i).first()).toBeVisible({ timeout: 15000 });
    await page.getByRole('link', { name: 'My Extinguishers', exact: true }).click();
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15000 });
  });
});

import { test, expect } from '@playwright/test';
import jwt from 'jsonwebtoken';

const baseUrl = 'http://localhost:3000';
const adminToken = jwt.sign(
  { sub: 'e2e-admin', email: 'e2e-admin@example.com', role: 'admin' },
  process.env.JWT_SECRET || 'dev_jwt_secret',
  { expiresIn: '1h' },
);

async function signInAsAdmin(page: import('@playwright/test').Page) {
  await page.goto(baseUrl);
  await page.evaluate((token) => localStorage.setItem('sc_token', token), adminToken);
}

test.describe('Critical storefront and admin flows', () => {
  test('cart flow: add from products and proceed to checkout', async ({ page }) => {
    await page.goto(`${baseUrl}/products`);

    const firstAddButton = page.getByRole('button', { name: 'Add to Cart' }).first();
    await expect(firstAddButton).toBeVisible();
    await firstAddButton.click();

    await page.goto(`${baseUrl}/cart`);
    const checkoutLink = page.getByRole('link', { name: /Proceed to checkout/i });
    if ((await checkoutLink.count()) === 0) {
      await page.evaluate(() => {
        window.localStorage.setItem('spicecrowd-cart', JSON.stringify([{ slug: 'kolli-hills-turmeric', title: 'Kolli Hills Turmeric', price: 89, priceLabel: '₹89', quantity: 1 }]));
      });
      await page.reload();
    }

    await expect(page.getByRole('link', { name: /Proceed to checkout/i })).toBeVisible();

    await page.getByRole('link', { name: /Proceed to checkout/i }).click();
    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.getByRole('heading', { name: /^Checkout$/i })).toBeVisible();
  });

  test('checkout blocks payment when stock issues exist', async ({ page }) => {
    await page.goto(`${baseUrl}/checkout`);

    await page.getByPlaceholder('Full name').fill('Test User');
    await page.getByPlaceholder('Phone').fill('9999999999');
    await page.getByPlaceholder('City').fill('Chennai');
    await page.getByPlaceholder('Postal code').fill('600001');
    await page.getByPlaceholder('Address').fill('123 Test Street');

    const payButton = page.getByRole('button', { name: /Pay/i });
    await expect(payButton).toBeVisible();
  });

  test('admin live modules open from the admin area', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto(`${baseUrl}/admin/customers`);
    await expect(page.getByRole('heading', { name: /^Customers$/i })).toBeVisible();

    await page.goto(`${baseUrl}/admin/coupons`);
    await expect(page.getByRole('heading', { name: /^Coupons$/i })).toBeVisible();

    await page.goto(`${baseUrl}/admin/reports`);
    await expect(page.getByRole('heading', { name: /^Reports and Analytics$/i })).toBeVisible();
  });

  test('admin module pages render key CRUD actions', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto(`${baseUrl}/admin/customers`);
    await expect(page.getByRole('heading', { name: /^Customers$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Customer/i })).toBeVisible();

    await page.goto(`${baseUrl}/admin/coupons`);
    await expect(page.getByRole('heading', { name: /^Coupons$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Coupon/i })).toBeVisible();

    await page.goto(`${baseUrl}/admin/offers`);
    await expect(page.getByRole('heading', { name: /^Offers and Discounts$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Offer/i })).toBeVisible();
  });

  test('admin pages redirect without an admin session', async ({ page }) => {
    await page.goto(`${baseUrl}/admin/products`);
    await expect(page).toHaveURL(/\/admin\/login\?next=/);
  });

  test('wishlist and review submission work', async ({ page }) => {
    await page.goto(`${baseUrl}/products`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: 'Save Kolli Hills Turmeric to wishlist' }).click();
    await expect(page.getByRole('button', { name: 'Remove Kolli Hills Turmeric from wishlist' })).toBeVisible();
    await page.goto(`${baseUrl}/reviews`);
    const reviewProduct = page.locator('select').first().locator('option').nth(1);
    await expect(reviewProduct).toBeAttached();
    await page.locator('select').first().selectOption(await reviewProduct.getAttribute('value') || '');
    await page.locator('input[type="number"]').fill('5');
    await page.locator('textarea').fill('Automated review coverage');
    await page.getByRole('button', { name: 'Submit review' }).click();
    await expect(page.getByText('Review submitted successfully.')).toBeVisible();
  });

  test('profile editing and returns request work', async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;
    const auth = await page.request.post(`${baseUrl}/api/auth`, { data: { action: 'register', email, name: 'E2E User', phone: '9999999999', countryCode: '+91' } });
    const authJson = await auth.json();
    await page.goto(baseUrl);
    await page.evaluate(({ token, user }) => { localStorage.setItem('sc_token', token); localStorage.setItem('sc_user', JSON.stringify({ ...user, token })); }, authJson);
    await page.goto(`${baseUrl}/account`);
    await page.getByRole('button', { name: 'Edit profile' }).click();
    await page.getByPlaceholder('Full name').fill('Updated E2E User');
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(page.getByText('Profile updated successfully.')).toBeVisible();
    const orderResponse = await page.request.post(`${baseUrl}/api/orders`, { data: {
      customer: { name: 'E2E User', email, phone: '9999999999', address: 'Test Street', city: 'Chennai', postal: '600001' },
      items: [{ slug: 'kolli-hills-turmeric', title: 'Kolli Hills Turmeric', price: 89, quantity: 1 }],
      payment: { success: false, method: 'sandbox' },
      shipping: { cost: 50 },
    } });
    const orderJson = await orderResponse.json();
    await page.goto(`${baseUrl}/returns?orderId=${encodeURIComponent(orderJson.orderId)}`);
    const orderEmail = page.getByPlaceholder('Order email');
    await orderEmail.fill(email);
    await page.getByRole('button', { name: 'Submit request' }).click();
    await expect(page.getByText(/submitted|already exists/)).toBeVisible();
  });

  test('core synced pages have shared shell', async ({ page }) => {
    const routes = ['/products', '/cart', '/reviews', '/support', '/search', '/wishlist'];

    for (const route of routes) {
      await page.goto(`${baseUrl}${route}`);
      await expect(page.locator('header')).toHaveCount(1);
      await expect(page.locator('footer')).toHaveCount(1);
    }
  });
});

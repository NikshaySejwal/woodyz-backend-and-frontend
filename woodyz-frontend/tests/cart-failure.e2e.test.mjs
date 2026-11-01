import test, { after, before } from 'node:test';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright';

import {
  addDisposableUser,
  assert,
  backendUrl,
  createAccountThroughUi,
  frontendUrl,
  openCart,
  queryDatabase,
  withCartPage,
} from './cart-e2e-support.mjs';

let browser;

before(async () => {
  browser = await chromium.launch({ headless: true });
});

after(async () => {
  await browser?.close();
});

test('product API 500 shows an error and does not add anything to cart', { timeout: 60000 }, async (t) => {
  await withCartPage(browser, t, async ({ context, page, products, failedResponses }) => {
    const [product] = products;
    await context.route(`${backendUrl}/api/products/${product.id}`, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'test failure' }) }),
    );
    await page.goto(`${frontendUrl}/products/${product.id}`);
    await page.getByRole('heading', { name: 'Failed to load product' }).waitFor();
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]')), []);
    assert.ok(failedResponses.some(({ url, status }) => url.endsWith(`/api/products/${product.id}`) && status === 500));
  });
});

test('rapid plus clicks are applied without lost quantity updates', { timeout: 60000 }, async (t) => {
  await withCartPage(browser, t, async ({ page, products }) => {
    const [product] = products;
    await page.goto(`${frontendUrl}/products/${product.id}`);
    await page.getByRole('button', { name: 'Add to Cart' }).click();
    await openCart(page);

    const increase = page.locator('button:has(iconify-icon[icon="ph:plus-bold"])');
    await Promise.all(Array.from({ length: 5 }, () => increase.click()));
    assert.equal(await page.locator('span.w-8.text-center.font-black').innerText(), '6');
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]').map(({ quantity }) => quantity)), [6]);
    assert.equal(await page.getByText('$74.04', { exact: true }).count(), 3);
  });
});

test('unauthenticated order creation is rejected without changing database orders', { timeout: 60000 }, async (t) => {
  await withCartPage(browser, t, async ({ context, products }) => {
    const [product] = products;
    const ordersBefore = Number(queryDatabase('SELECT count(*) FROM orders;'));
    const response = await context.request.post(`${backendUrl}/api/orders/`, {
      data: { paymentIntentId: 'pi_e2e_unauthenticated', items: [{ productId: product.id, quantity: 1 }] },
    });
    const body = await response.text();

    assert.ok([401, 403].includes(response.status()), `Expected 401/403, got ${response.status()}: ${body}`);
    assert.equal(Number(queryDatabase('SELECT count(*) FROM orders;')), ordersBefore);
  });
});

test('authenticated payment API rejects invalid cart quantities and unknown product ids', { timeout: 60000 }, async (t) => {
  await withCartPage(browser, t, async (fixture) => {
    const [product] = fixture.products;
    const user = await addDisposableUser(fixture);
    await createAccountThroughUi(fixture.page, user);
    const token = await fixture.page.evaluate(() => localStorage.getItem('token'));
    assert.ok(token);
    const idempotencyKey = () => randomUUID();

    for (const quantity of [0, -1, 101]) {
      const response = await fixture.context.request.post(`${backendUrl}/api/payments/create-payment-intent`, {
        headers: { Authorization: `Bearer ${token}`, 'Idempotency-Key': idempotencyKey() },
        data: { items: [{ productId: product.id, quantity }] },
      });
      assert.equal(response.status(), 400, `quantity=${quantity}: ${await response.text()}`);
    }

    const missingProduct = await fixture.context.request.post(`${backendUrl}/api/payments/create-payment-intent`, {
      headers: { Authorization: `Bearer ${token}`, 'Idempotency-Key': idempotencyKey() },
      data: { items: [{ productId: 999999999, quantity: 1 }] },
    });
    assert.equal(missingProduct.status(), 400, await missingProduct.text());
    assert.equal(Number(queryDatabase('SELECT count(*) FROM orders;')), 1);
  });
});

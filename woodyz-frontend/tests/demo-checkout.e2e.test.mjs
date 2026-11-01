import test from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  addProductFromDetail,
  createAccountThroughUi,
  openCart,
} from './cart-e2e-support.mjs';
import { withDemoUsers, backendUrl, frontendUrl, queryDatabase, uniqueFixtureName } from './demo-e2e-support.mjs';

const rootEnv = readFileSync(resolve(process.cwd(), '..', '.env'), 'utf8');
const readLocalSetting = (key) => rootEnv.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1] || '';
const adminUsername = readLocalSetting('ADMIN_USERNAME') || 'admin';
const adminPassword = readLocalSetting('ADMIN_PASSWORD');

test('three disposable customers place separate local demo orders and raise delivery tickets', { timeout: 180000 }, async () => {
  await withDemoUsers(async ({ browser, sessions, products, evidence }) => {
    const methods = ['DEMO_QR', 'DEMO_DELIVERY', 'DEMO_DELIVERY'];
    const completedOrders = [];

    for (let index = 0; index < sessions.length; index += 1) {
      const { user, page } = sessions[index];
      const product = products[index];
      await createAccountThroughUi(page, user);
      await addProductFromDetail(page, product);
      await openCart(page);
      await page.goto(`${frontendUrl}/checkout`);
      await page.locator('#checkout-first-name').fill(`Customer${index + 1}`);
      await page.locator('#checkout-last-name').fill('QA');
      await page.locator('#checkout-address').fill(`${index + 1} Example Lane`);
      await page.locator('#checkout-city').fill('Bengaluru');
      await page.locator('#checkout-zip').fill(`56000${index + 1}`);

      const paymentMethod = methods[index] === 'DEMO_QR' ? 'QR payment (demo)' : 'Pay on delivery (demo)';
      await page.getByRole('button', { name: paymentMethod }).click();
      const intentResponse = page.waitForResponse((response) =>
        response.url() === `${backendUrl}/api/payments/demo-intent` && response.request().method() === 'POST',
      );
      await page.getByRole('button', { name: 'Prepare demo checkout' }).click();
      const response = await intentResponse;
      assert.equal(response.status(), 200);
      const intent = await response.json();
      assert.equal(intent.demo, true);
      assert.equal(intent.method, methods[index]);
      assert.equal(intent.amount, product.price);
      assert.match(intent.paymentIntentId, /^demo_/);
      if (methods[index] === 'DEMO_QR') {
        await page.getByRole('img', { name: /decorative demo QR code/i }).waitFor();
        await page.getByText(/not scannable and not linked to a bank/i).waitFor();
      }

      const orderResponse = page.waitForResponse((response) =>
        response.url().includes('/api/orders') && response.request().method() === 'POST',
      );
      const dialogPromise = page.waitForEvent('dialog');
      await page.getByRole('button', { name: 'Confirm demo order' }).click();
      const dialog = await dialogPromise;
      assert.match(dialog.message(), /No payment or email was sent/);
      await dialog.accept();
      const savedResponse = await orderResponse;
      assert.equal(savedResponse.status(), 200);
      const order = await savedResponse.json();
      assert.equal(order.totalAmount, product.price);
      assert.equal(order.deliveryAddress, `Customer${index + 1} QA, ${index + 1} Example Lane, Bengaluru, 56000${index + 1}`);
      completedOrders.push(order);

      await page.goto(`${frontendUrl}/orders`);
      await page.getByText(`Order #${order.id}`, { exact: true }).waitFor();
      const profile = await page.evaluate(async (apiUrl) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiUrl}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return { status: response.status, body: await response.json() };
      }, backendUrl);
      assert.equal(profile.status, 200);
      assert.ok(profile.body.id);
      assert.equal(profile.body.username, user.username);
      assert.equal(Number(queryDatabase(`SELECT count(*) FROM orders WHERE id = ${order.id} AND user_id = ${profile.body.id} AND payment_intent_id = '${intent.paymentIntentId}';`)), 1);
      assert.equal(Number(queryDatabase(`SELECT count(*) FROM orders WHERE user_id = ${profile.body.id};`)), 1);
      assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]')), []);

      await page.goto(`${frontendUrl}/`);
      await page.getByRole('button', { name: 'Contact support' }).click();
      await page.locator('#support-subject').fill(`Delivery concern ${index + 1}`);
      await page.locator('#support-message').fill(`Please confirm delivery timing for demo order ${order.id}.`);
      const ticketResponse = page.waitForResponse((response) =>
        response.url() === `${backendUrl}/api/support/` && response.request().method() === 'POST',
      );
      await page.getByRole('button', { name: 'Send Message' }).click();
      assert.equal((await ticketResponse).status(), 200);
      await page.getByText('Message Flown Away!').waitFor();
    }

    assert.equal(completedOrders.length, 3);
    assert.deepEqual(evidence.failedResponses, []);
    assert.deepEqual(evidence.failedRequests, []);
    assert.equal(evidence.consoleErrors.length, 0);
    await runAdminChecks(browser);
  });
});

async function runAdminChecks(browser) {
  assert.ok(adminPassword, 'ADMIN_PASSWORD must be set in the local ignored .env file');
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const couponCode = uniqueFixtureName('QA').toUpperCase();
  const quoteEmail = `${uniqueFixtureName('manufacturing').toLowerCase()}@example.test`;
  let quoteId;

  try {
    await page.goto(`${frontendUrl}/auth/login`);
    await page.locator('#login-username').fill(adminUsername);
    await page.locator('#login-password').fill(adminPassword);
    await page.getByRole('button', { name: 'Log In' }).click();
    await page.waitForURL(`${frontendUrl}/`);

    await page.goto(`${frontendUrl}/admin/analytics`);
    await page.getByRole('heading', { name: 'Platform Performance' }).waitFor();
    const analyticsResponse = page.waitForResponse((response) =>
      response.url().endsWith('/api/analytics/summary'),
    );
    await page.reload();
    const analytics = await (await analyticsResponse).json();
    assert.ok(analytics.totalOrders >= 3);
    assert.ok(analytics.totalProducts >= 4);
    assert.ok(Number.isFinite(analytics.totalRevenue));
    await page.getByText('Total Orders').waitFor();

    await page.goto(`${frontendUrl}/admin/coupons`);
    await page.locator('input[placeholder="e.g. SUMMER20"]').fill(couponCode);
    await page.locator('input[type="number"]').fill('15');
    await page.locator('input[type="datetime-local"]').fill('2030-01-01T12:00');
    const couponResponse = page.waitForResponse((response) =>
      response.url().endsWith('/api/coupons') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Create Coupon' }).click();
    assert.equal((await couponResponse).status(), 201);
    await page.getByText(couponCode, { exact: true }).waitFor();
    const couponRow = page.getByRole('row').filter({ hasText: couponCode });
    await couponRow.getByRole('button', { name: 'Deactivate' }).click();
    await couponRow.getByText('Inactive').waitFor();
    await couponRow.getByRole('button', { name: 'Activate' }).click();
    await couponRow.getByText('Active').waitFor();
    page.once('dialog', (dialog) => dialog.accept());
    await couponRow.getByRole('button', { name: 'Delete' }).click();
    await couponRow.waitFor({ state: 'detached' });
    assert.equal(Number(queryDatabase(`SELECT count(*) FROM coupons WHERE code = '${couponCode}';`)), 0);

    await page.goto(`${frontendUrl}/manufacturing#quote`);
    await page.locator('#quote-name').fill('Synthetic QA Request');
    await page.locator('#quote-email').fill(quoteEmail);
    await page.locator('#quote-phone').fill('+91 90000 00001');
    await page.locator('#quote-company').fill('Example QA Workshop');
    await page.locator('#quote-product').selectOption({ label: 'Corporate gifts' });
    await page.locator('#quote-quantity').fill('25');
    await page.locator('#quote-material').fill('FSC plywood');
    await page.locator('#quote-process').fill('Laser engraving');
    await page.locator('#quote-message').fill('Synthetic test request; no production should be scheduled.');
    const quoteResponse = page.waitForResponse((response) =>
      response.url().endsWith('/api/manufacturing/quotes') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Send quote request' }).click();
    const quoteResult = await (await quoteResponse).json();
    quoteId = quoteResult.id;
    await page.getByText('Request ID').waitFor();

    await page.goto(`${frontendUrl}/admin/manufacturing-quotes`);
    await page.getByText(quoteEmail, { exact: true }).waitFor();

    await page.goto(`${frontendUrl}/admin/support`);
    await page.getByRole('heading', { name: 'Support Tickets' }).waitFor();
    await page.getByText('Delivery concern 1').waitFor({ timeout: 30000 });
    const ticketForms = page.locator('form').filter({ has: page.locator('input[name="reply"]') });
    const ticketCount = await ticketForms.count();
    assert.ok(ticketCount > 0);
    for (let index = 0; index < ticketCount; index += 1) {
      const form = ticketForms.nth(index);
      await form.locator('input[name="reply"]').fill('Thanks for contacting WOODYZ Support. We have recorded your request and will review the delivery details. This reply is saved in the support portal; no email was sent.');
      const replySaved = page.waitForResponse((response) =>
        /\/api\/support\/\d+\/message$/.test(response.url()) && response.request().method() === 'POST',
      );
      const dialogPromise = page.waitForEvent('dialog');
      await form.getByRole('button').click();
      const dialog = await dialogPromise;
      assert.equal(dialog.message(), 'Reply recorded in-app; no email was sent.');
      await dialog.accept();
      assert.equal((await replySaved).status(), 200);
    }
    const savedTickets = await page.evaluate(async () => {
      const response = await fetch('http://localhost:8080/api/support', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return { status: response.status, tickets: await response.json() };
    });
    assert.equal(savedTickets.status, 200);
    assert.equal(savedTickets.tickets.length, ticketCount);
    assert.ok(savedTickets.tickets.every((ticket) => ticket.message.includes('This reply is saved in the support portal')));
  } finally {
    if (quoteId) queryDatabase(`DELETE FROM manufacturing_quote_requests WHERE id = ${Number(quoteId)};`);
    queryDatabase(`DELETE FROM coupons WHERE code = '${couponCode}';`);
    await context.close();
  }
}

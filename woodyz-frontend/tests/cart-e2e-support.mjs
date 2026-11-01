import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

export const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
export const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export function queryDatabase(sql) {
  return execFileSync('docker', [
    'compose', 'exec', '-T', 'db', 'psql', '-U', 'postgres', '-d', 'woodyz',
    '-v', 'ON_ERROR_STOP=1', '-q', '-A', '-t', '-c', sql,
  ], { cwd: repositoryRoot, encoding: 'utf8' }).trim();
}

export function createProductFixtures(count = 1) {
  return Array.from({ length: count }, (_, index) => {
    const name = `QA_CART_${randomUUID().replaceAll('-', '')}_${index}`;
    const id = Number(queryDatabase(
      `INSERT INTO products (name, description, price, category, image_url) ` +
      `VALUES ('${name}', 'Temporary cart E2E product', 12.34, 'QA E2E', NULL) RETURNING id;`,
    ));
    assert.ok(Number.isInteger(id), `Product fixture was not inserted: ${name}`);
    return { id, name, price: 12.34 };
  });
}

export function deleteProducts(products) {
  for (const product of products) {
    queryDatabase(`DELETE FROM products WHERE id = ${product.id};`);
  }
}

export function createUserFixture() {
  const username = `qa_${randomUUID().replaceAll('-', '')}`;
  return {
    username,
    email: `${username}@example.test`,
    password: `Qa-${randomUUID()}!`,
  };
}

export function deleteUsers(users) {
  for (const user of users) {
    queryDatabase(`DELETE FROM users WHERE username = '${user.username}';`);
  }
}

export async function withCartPage(browser, testContext, run, options = {}) {
  const products = createProductFixtures(options.productCount || 1);
  const context = await browser.newContext({
    viewport: options.viewport || { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  const requests = [];
  const failedResponses = [];
  const consoleErrors = [];
  const failedRequests = [];

  page.on('request', (request) => {
    if (request.url().includes('/api/')) {
      requests.push({
        method: request.method(),
        url: request.url(),
        postData: request.postData(),
        headers: request.headers(),
      });
    }
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      failedResponses.push({
        method: response.request().method(),
        url: response.url(),
        status: response.status(),
      });
    }
  });
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`);
  });

  const fixture = { context, page, products, requests, failedResponses, consoleErrors, failedRequests, users: [] };
  try {
    await run(fixture);
    if (failedResponses.length || failedRequests.length || consoleErrors.length) {
      console.log(`[browser evidence] ${testContext.name}: ${JSON.stringify({
        failedResponses,
        failedRequests,
        consoleErrors,
      })}`);
    }
  } catch (error) {
    const filename = testContext.name.replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
    const screenshot = join(tmpdir(), `woodyz-${filename}.png`);
    await page.screenshot({ path: screenshot, fullPage: true }).catch(() => {});
    error.message += `\nBrowser evidence: ${screenshot}\n` +
      `HTTP failures: ${JSON.stringify(failedResponses)}\n` +
      `Failed requests: ${JSON.stringify(failedRequests)}\n` +
      `Console errors: ${JSON.stringify(consoleErrors)}`;
    throw error;
  } finally {
    await context.close();
    deleteProducts(products);
    deleteUsers(fixture.users);
  }
}

export async function openProduct(page, product) {
  const responsePromise = page.waitForResponse((response) =>
    response.url() === `${backendUrl}/api/products/${product.id}`,
  );
  await page.goto(`${frontendUrl}/products/${product.id}`);
  const response = await responsePromise;
  assert.equal(response.status(), 200, `Product GET returned ${response.status()}`);
  const responseBody = await response.json();
  assert.equal(responseBody.id, product.id);
  assert.equal(responseBody.name, product.name);
  assert.equal(responseBody.price, product.price);
  await page.getByRole('heading', { name: product.name, exact: true }).waitFor();
}

export async function addProductFromDetail(page, product, count = 1) {
  await openProduct(page, product);
  const addButton = page.getByRole('button', { name: 'Add to Cart' });
  for (let index = 0; index < count; index += 1) {
    await addButton.click();
  }
}

export async function openCart(page) {
  await page.getByRole('link', { name: /Shopping cart, \d+ items/ }).click();
  await page.getByRole('heading', { name: 'Your Bag' }).waitFor();
}

export async function assertCartItem(page, product, quantity) {
  await page.getByRole('heading', { name: product.name, exact: true }).waitFor();
  assert.deepEqual(
    await page.locator('span.w-8.text-center.font-black').allTextContents(),
    [String(quantity)],
  );
  const storedCart = await page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]'));
  assert.deepEqual(storedCart.map(({ id, quantity: itemQuantity, price }) => ({
    id,
    quantity: itemQuantity,
    price,
  })), [{ id: product.id, quantity, price: product.price }]);
}

export async function assertCartTotals(page, itemTotal, cartTotal = itemTotal) {
  assert.equal(await page.getByText(`$${itemTotal}`, { exact: true }).count(), 3);
  assert.equal(await page.getByText(`$${cartTotal}`, { exact: true }).count(), 3);
}

export async function createAccountThroughUi(page, user) {
  await page.goto(`${frontendUrl}/auth/register`);
  await page.locator('#reg-username').fill(user.username);
  await page.locator('#reg-email').fill(user.email);
  await page.locator('#reg-password').fill(user.password);
  await page.getByRole('button', { name: 'Create Account' }).click();
  await page.waitForURL('**/auth/login');

  await page.locator('#login-username').fill(user.username);
  await page.locator('#login-password').fill(user.password);
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.waitForURL(`${frontendUrl}/`);
  await page.locator('header').getByText(user.username, { exact: true }).waitFor();
}

export async function addDisposableUser(fixture) {
  const user = createUserFixture();
  fixture.users.push(user);
  return user;
}

export function logBrowserEvents(fixture, label) {
  if (fixture.failedResponses.length || fixture.failedRequests.length || fixture.consoleErrors.length) {
    console.log(`[browser evidence] ${label}: ${JSON.stringify({
      failedResponses: fixture.failedResponses,
      failedRequests: fixture.failedRequests,
      consoleErrors: fixture.consoleErrors,
    })}`);
  }
}

export { assert };

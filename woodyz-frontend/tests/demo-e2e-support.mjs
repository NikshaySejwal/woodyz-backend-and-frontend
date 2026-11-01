import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright';
import {
  backendUrl,
  createProductFixtures,
  createUserFixture,
  deleteProducts,
  frontendUrl,
  queryDatabase,
} from './cart-e2e-support.mjs';

export async function withDemoUsers(run) {
  const products = createProductFixtures(3);
  const users = Array.from({ length: 3 }, createUserFixture);
  const browser = await chromium.launch({ headless: true });
  const contexts = [];
  const evidence = { failedResponses: [], failedRequests: [], consoleErrors: [] };

  try {
    const sessions = await Promise.all(users.map(async (user) => {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      contexts.push(context);
      const page = await context.newPage();
      page.on('response', (response) => {
        if (response.status() >= 400 && response.url().includes('/api/')) {
          evidence.failedResponses.push(`${response.status()} ${response.request().method()} ${response.url()}`);
        }
      });
      page.on('requestfailed', (request) => {
        if (request.url().includes('/api/')) evidence.failedRequests.push(`${request.method()} ${request.url()}`);
      });
      page.on('console', (message) => {
        if (message.type() === 'error') evidence.consoleErrors.push(message.text());
      });
      return { user, page };
    }));

    await run({ browser, sessions, products, evidence });
  } finally {
    for (const context of contexts) await context.close();
    await browser.close();
    const usernames = users.map(({ username }) => `'${username}'`).join(',');
    queryDatabase(`DELETE FROM order_status_history WHERE order_id IN (SELECT id FROM orders WHERE user_id IN (SELECT id FROM users WHERE username IN (${usernames})));`);
    queryDatabase(`DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE username IN (${usernames}));`);
    queryDatabase(`DELETE FROM support_tickets WHERE user_id IN (SELECT id FROM users WHERE username IN (${usernames}));`);
    queryDatabase(`DELETE FROM users WHERE username IN (${usernames});`);
    deleteProducts(products);
  }
}

export function uniqueFixtureName(prefix) {
  return `${prefix}_${randomUUID().replaceAll('-', '')}`;
}

export { backendUrl, frontendUrl, queryDatabase };

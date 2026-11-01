import test, { after, before } from 'node:test';
import { chromium } from 'playwright';

import {
  addProductFromDetail,
  addDisposableUser,
  assert,
  assertCartItem,
  assertCartTotals,
  createAccountThroughUi,
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

test('adds one product and verifies API data, cart badge, subtotal, and browser persistence', { timeout: 60000 }, async (t) => {
  await withCartPage(browser, t, async (fixture) => {
    const [product] = fixture.products;
    await addProductFromDetail(fixture.page, product);
    assert.equal(fixture.requests.filter(({ url }) => url.includes('/api/cart')).length, 0);

    await openCart(fixture.page);
    await assertCartItem(fixture.page, product, 1);
    await assertCartTotals(fixture.page, '12.34');
    assert.equal(Number(queryDatabase(`SELECT count(*) FROM products WHERE id = ${product.id};`)), 1);
    assert.equal(Number(queryDatabase("SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='carts';")), 0);
    assert.equal(Number(queryDatabase('SELECT count(*) FROM orders;')), 1);
  });
});

test('adding the same product twice merges into one line and doubles the total', { timeout: 60000 }, async (t) => {
  await withCartPage(browser, t, async ({ page, products }) => {
    const [product] = products;
    await addProductFromDetail(page, product, 2);
    await openCart(page);
    await assertCartItem(page, product, 2);
    await assertCartTotals(page, '24.68');
    assert.equal(await page.getByRole('heading', { name: product.name, exact: true }).count(), 1);
  });
});

test('plus and minus change quantity by one; decrementing at one removes the item', { timeout: 60000 }, async (t) => {
  await withCartPage(browser, t, async ({ page, products }) => {
    const [product] = products;
    await addProductFromDetail(page, product, 2);
    await openCart(page);

    await page.locator('button:has(iconify-icon[icon="ph:plus-bold"])').click();
    await assertCartItem(page, product, 3);
    await assertCartTotals(page, '37.02');

    await page.locator('button:has(iconify-icon[icon="ph:minus-bold"])').click();
    await assertCartItem(page, product, 2);
    await page.locator('button:has(iconify-icon[icon="ph:minus-bold"])').click();
    await assertCartItem(page, product, 1);
    await page.locator('button:has(iconify-icon[icon="ph:minus-bold"])').click();
    await page.getByRole('heading', { name: product.name, exact: true }).waitFor({ state: 'detached' });
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]')), []);
  });
});

test('remove clears only the selected product and totals for remaining products', { timeout: 60000 }, async (t) => {
  await withCartPage(browser, t, async ({ page, products }) => {
    const [first, second] = products;
    second.price = 20.00;
    queryDatabase(`UPDATE products SET price = ${second.price} WHERE id = ${second.id};`);
    await addProductFromDetail(page, first);
    await addProductFromDetail(page, second);
    await openCart(page);

    await page.getByRole('button', { name: 'Remove' }).first().click();
    await page.getByRole('heading', { name: first.name, exact: true }).waitFor({ state: 'detached' });
    await assertCartItem(page, second, 1);
    await assertCartTotals(page, '20.00');
    assert.deepEqual(
      (await page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]'))).map(({ id }) => id),
      [second.id],
    );
  }, { productCount: 2 });
});

test('cart remains after refresh and navigating away and back', { timeout: 60000 }, async (t) => {
  await withCartPage(browser, t, async ({ page, products }) => {
    const [product] = products;
    await addProductFromDetail(page, product);
    await page.goto('http://localhost:3000/products');
    await page.goto('http://localhost:3000/cart');
    await assertCartItem(page, product, 1);
    await page.reload();
    await assertCartItem(page, product, 1);
    await assertCartTotals(page, '12.34');
  });
});

test('logging out clears cart items from the page and browser storage', { timeout: 60000 }, async (t) => {
  await withCartPage(browser, t, async (fixture) => {
    const [product] = fixture.products;
    const user = await addDisposableUser(fixture);
    await createAccountThroughUi(fixture.page, user);
    await addProductFromDetail(fixture.page, product);
    await openCart(fixture.page);

    await fixture.page.getByRole('button', { name: 'Logout' }).click();
    await fixture.page.waitForURL('**/auth/login');
    assert.deepEqual(await fixture.page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]')), []);
    assert.equal(await fixture.page.evaluate(() => localStorage.getItem('token')), null);

    await fixture.page.goto('http://localhost:3000/cart');
    await fixture.page.getByRole('heading', { name: 'Your bag is empty' }).waitFor();
  });
});

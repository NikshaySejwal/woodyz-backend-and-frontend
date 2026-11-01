import test, { after, before } from 'node:test';
import { chromium } from 'playwright';

import {
  addProductFromDetail,
  assert,
  assertCartItem,
  frontendUrl,
  openCart,
  withCartPage,
} from './cart-e2e-support.mjs';

let browser;

before(async () => {
  browser = await chromium.launch({ headless: true });
});

after(async () => {
  await browser?.close();
});

test('mobile cart has no horizontal overflow and quantity buttons remain reachable', { timeout: 60000 }, async (t) => {
  await withCartPage(browser, t, async ({ page, products }) => {
    const [product] = products;
    await addProductFromDetail(page, product);
    await openCart(page);
    const dimensions = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      pageWidth: document.documentElement.scrollWidth,
    }));
    assert.ok(dimensions.pageWidth <= dimensions.viewportWidth, JSON.stringify(dimensions));
    assert.equal(await page.locator('button:has(iconify-icon[icon="ph:plus-bold"])').isVisible(), true);
    await assertCartItem(page, product, 1);
  }, { viewport: { width: 375, height: 812 } });
});

test('quantity controls can be operated with the keyboard', { timeout: 60000 }, async (t) => {
  await withCartPage(browser, t, async ({ page, products }) => {
    const [product] = products;
    await addProductFromDetail(page, product);
    await openCart(page);
    const increase = page.locator('button:has(iconify-icon[icon="ph:plus-bold"])');
    await increase.focus();
    await page.keyboard.press('Enter');
    await assertCartItem(page, product, 2);
  });
});

test('quantity controls expose meaningful accessible names', { timeout: 60000 }, async (t) => {
  await withCartPage(browser, t, async ({ page, products }) => {
    const [product] = products;
    await addProductFromDetail(page, product);
    await openCart(page);
    await page.getByRole('button', { name: 'Decrease quantity' }).waitFor();
    await page.getByRole('button', { name: 'Increase quantity' }).waitFor();
  });
});

test('a second open tab reflects quantity updates made in the first tab', { timeout: 60000 }, async (t) => {
  await withCartPage(browser, t, async ({ context, page, products }) => {
    const [product] = products;
    await addProductFromDetail(page, product);
    await openCart(page);

    const secondTab = await context.newPage();
    await secondTab.goto(`${frontendUrl}/cart`);
    await assertCartItem(secondTab, product, 1);
    await secondTab.locator('button:has(iconify-icon[icon="ph:plus-bold"])').click();

    assert.equal(
      await page.getByRole('link', { name: 'Shopping cart, 2 items' }).count(),
      1,
      'First tab should update after a quantity change in the second tab',
    );
  });
});

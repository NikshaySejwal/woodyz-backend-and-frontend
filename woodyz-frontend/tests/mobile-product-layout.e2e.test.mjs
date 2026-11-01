import test from 'node:test';
import { strict as assert } from 'node:assert';
import { chromium } from 'playwright';
import {
  backendUrl,
  createProductFixtures,
  deleteProducts,
  frontendUrl,
  queryDatabase,
} from './cart-e2e-support.mjs';

test('mobile product cards use nearly full-width imagery without horizontal overflow', { timeout: 60000 }, async () => {
  const products = createProductFixtures();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();

  try {
    queryDatabase(`UPDATE products SET image_url = '/images/blocks.png' WHERE id = ${products[0].id};`);
    const response = await fetch(`${backendUrl}/api/products`);
    assert.equal(response.status, 200);
    await page.goto(`${frontendUrl}/products`);
    await page.getByRole('heading', { name: products[0].name, exact: true }).waitFor();
    await page.waitForFunction((selector) => {
      const image = document.querySelector(selector);
      return image?.complete && image.naturalWidth > 0;
    }, `a[href="/products/${products[0].id}"] img`);

    const layout = await page.locator(`a[href="/products/${products[0].id}"]`).evaluate((card) => {
      const cardRect = card.getBoundingClientRect();
      const imageRect = card.querySelector('img')?.getBoundingClientRect();
      window.scrollTo({ left: 500, top: 0 });
      return {
        viewportWidth: window.innerWidth,
        cardWidth: Math.round(cardRect.width),
        cardX: Math.round(cardRect.x),
        cardRight: Math.round(cardRect.right),
        imageWidth: Math.round(imageRect?.width || 0),
        imageLoaded: Boolean(card.querySelector('img')?.naturalWidth),
        horizontalScroll: window.scrollX,
      };
    });

    assert.equal(layout.viewportWidth, 375);
    assert.ok(layout.cardWidth >= 330, `Product card was only ${layout.cardWidth}px wide`);
    assert.ok(layout.cardX <= 16, `Product card left margin was ${layout.cardX}px`);
    assert.ok(layout.cardRight <= layout.viewportWidth, 'Product card must fit within the mobile viewport');
    assert.ok(layout.imageWidth >= 315, `Product image was only ${layout.imageWidth}px wide`);
    assert.equal(layout.horizontalScroll, 0, 'Mobile page must not scroll horizontally');
    assert.equal(layout.imageLoaded, true, 'Product image must load from the backend API origin');
  } finally {
    await context.close();
    await browser.close();
    deleteProducts(products);
  }
});

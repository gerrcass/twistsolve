import { chromium } from '@playwright/test';
import { statSync } from 'node:fs';

const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:4173';
const output = process.env.SCREENSHOT_PATH ?? 'assets/screenshot.png';

const browser = await chromium.launch({
  headless: true,
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
});

const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  colorScheme: 'dark',
});

await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => document.fonts.ready);
await page
  .getByTestId('solver-badge')
  .and(page.locator('[data-status="ready"]'))
  .waitFor({ timeout: 30_000 });

await page.getByTestId('scramble-button').click();
await page
  .getByTestId('status-label')
  .filter({ hasText: 'Scrambled' })
  .waitFor({ timeout: 30_000 });

await page.getByTestId('solve-button').click();
await page
  .getByTestId('status-label')
  .filter({ hasText: 'Solved' })
  .waitFor({ timeout: 60_000 });
await page
  .getByTestId('result-stamp')
  .and(page.locator('[data-visible="true"]'))
  .waitFor({ timeout: 5_000 });

await page.waitForTimeout(700);
await page.evaluate(() => {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
});
await page.mouse.move(4, 4);
await page.screenshot({ path: output, fullPage: false });

const size = statSync(output).size;
console.log(`Captured ${output} (${(size / 1024).toFixed(0)} kB)`);

await browser.close();

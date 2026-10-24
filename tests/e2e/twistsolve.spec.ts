import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

function status(page: Page) {
  return page.getByTestId('status-label');
}

async function expectSolverReady(page: Page) {
  await expect(page.getByTestId('solver-badge')).toHaveAttribute(
    'data-status',
    'ready',
    { timeout: 30_000 },
  );
}

test('scrambles and solves with a fresh Solution', async ({ page }) => {
  await page.goto('/');

  await expect(status(page)).toHaveText('Solved');
  await expect(page.getByTestId('cube-stage')).toBeVisible();
  await expectSolverReady(page);

  await page.getByTestId('scramble-button').click();
  await expect(status(page)).toHaveText('Scrambled', { timeout: 30_000 });

  const scramble = page
    .getByTestId('scramble-sequence')
    .locator('.move-chip');
  await expect(scramble).toHaveCount(25);

  await page.getByTestId('solve-button').click();
  await expect(status(page)).toHaveText('Solved', { timeout: 60_000 });

  await expect(page.getByTestId('solve-receipt')).toBeVisible();
  await expect(page.getByTestId('solution-not-inverse')).toContainText(
    'not the inverse Scramble',
  );
  await expect(page.getByTestId('result-stamp')).toHaveAttribute(
    'data-visible',
    'true',
  );

  const solution = page
    .getByTestId('solution-sequence')
    .locator('.move-chip');
  const count = await solution.count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThanOrEqual(30);

  await expect(page.getByTestId('stage-status')).toContainText('Solved');
});

test('honors Reduced Motion end to end', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  await expect(status(page)).toHaveText('Solved');
  await expect(page.locator('.stage__speed')).toHaveAttribute(
    'data-reduced',
    'true',
  );

  await page.getByTestId('scramble-button').click();
  await expect(status(page)).toHaveText('Scrambled', { timeout: 15_000 });

  await page.getByTestId('solve-button').click();
  await expect(status(page)).toHaveText('Solved', { timeout: 30_000 });
  await expect(page.getByTestId('solve-receipt')).toBeVisible();
});

test('turns a face by hand and resets', async ({ page }) => {
  await page.goto('/');
  await expect(status(page)).toHaveText('Solved');

  await page.getByTestId('manual-r').click();
  await expect(status(page)).toHaveText('Custom state', { timeout: 15_000 });

  await expect(page.getByTestId('reset-button')).toBeEnabled();
  await page.getByTestId('reset-button').click();

  await expect(status(page)).toHaveText('Solved');
  await expect(page.getByTestId('scramble-sequence')).toContainText(
    'No Scramble yet',
  );
});

test('has no horizontal overflow on a phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.getByTestId('scramble-button')).toBeVisible();
  await expect(page.getByTestId('solve-button')).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

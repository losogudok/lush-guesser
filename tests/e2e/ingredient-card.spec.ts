import { expect, test } from '@playwright/test';

test('reveals every ingredient without rendering an empty card', async ({ page }) => {
  const pageErrors: string[] = [];

  await page.addInitScript(() => {
    Math.random = () => 0.5;
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');
  await page.getByRole('button', { name: 'START GAME' }).click();

  // A deterministic shuffle makes the first round Confetti, which has three ingredients.
  await expect(page.getByText('Rose', { exact: true })).toBeVisible();
  for (let reveal = 0; reveal < 2; reveal += 1) {
    await page.getByRole('button', { name: /Reveal Next/ }).click();
  }

  await expect(page.getByText('Violet', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Reveal Next/ })).toHaveCount(0);

  await page.getByTestId('answer-option').first().click();
  await page.getByTestId('next-round').click();
  await expect(page.getByText('Cedar', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Reveal Next/ }).click();
  await expect(page.getByText('Clove', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Reveal Next/ })).toHaveCount(0);

  expect(pageErrors).toEqual([]);
});

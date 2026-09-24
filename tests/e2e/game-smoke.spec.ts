import { expect, test } from '@playwright/test';

test('Telegram Mini App completes a Game Session and submits a Leaderboard Entry', async ({ page }) => {
  const displayName = `Playwright${Date.now().toString().slice(-6)}`;

  await page.route(
    /^https:\/\/telegram\.org\/js\/telegram-web-app\.js\?63$/,
    (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: `window.Telegram = { WebApp: { ready: () => { window.__telegramReadyCalls = (window.__telegramReadyCalls || 0) + 1; } } };`,
      }),
  );
  await page.goto('/');
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as Window & { __telegramReadyCalls?: number })
            .__telegramReadyCalls,
      ),
    )
    .toBe(1);

  await page.getByTitle('How to Play').click();
  await expect(page.getByRole('dialog', { name: 'How to Play' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'How to Play' })).toBeHidden();

  await page.getByRole('button', { name: 'Start Game' }).click();

  for (let round = 0; round < 10; round += 1) {
    await page.getByTestId('answer-option').first().click();
    await page.getByTestId('next-round').click();
  }

  await expect(page.getByText('Final Score')).toBeVisible();
  await page.getByPlaceholder('Enter name (max 20 chars)').fill(displayName);
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('Global High Scores')).toBeVisible();
  await expect(page.getByRole('cell', { name: displayName })).toBeVisible();
});

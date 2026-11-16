import { expect, test, type Page } from '@playwright/test';

const completeGameSession = async (page: Page) => {
  for (let round = 0; round < 10; round += 1) {
    await page.getByTestId('answer-option').first().click();
    await page.getByTestId('next-round').click();
  }

  await expect(page.getByText('Final Score')).toBeVisible();
};

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
  await completeGameSession(page);

  await page
    .getByPlaceholder('Enter name (max 20 chars)')
    .fill(`  ${displayName}  `);
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('Global High Scores')).toBeVisible();
  await expect(page.getByRole('cell', { name: displayName })).toBeVisible();
});

test('Player sees a clear submission failure without a false success state', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Game' }).click();
  await completeGameSession(page);

  await page
    .getByPlaceholder('Enter name (max 20 chars)')
    .fill('This Player Name Is Far Too Long');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByRole('alert')).toHaveText(
    'Could not save your score. Check your display name and try again.',
  );
  await expect(page.getByText('✓ Score saved to leaderboard!')).toBeHidden();
  await expect(page.getByText('Final Score')).toBeVisible();

  const displayName = `Retry${Date.now().toString().slice(-6)}`;
  await page.getByPlaceholder('Enter name (max 20 chars)').fill(displayName);
  await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('alert')).toBeHidden();
  await expect(page.getByText('Global High Scores')).toBeVisible();
  await expect(page.getByRole('cell', { name: displayName })).toBeVisible();
});

test('Player sees a clear submission failure when the connection fails', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Game' }).click();
  await completeGameSession(page);

  await page.route('**/api/leaderboard', (route) => route.abort('connectionfailed'));
  await page.getByPlaceholder('Enter name (max 20 chars)').fill('Ada');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByRole('alert')).toHaveText(
    'Could not save your score. Check your display name and try again.',
  );
  await expect(page.getByText('✓ Score saved to leaderboard!')).toBeHidden();
  await expect(page.getByText('Final Score')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();
});

test('Player can quit and replay with a fresh Game Session', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Game' }).click();
  await page.getByRole('button', { name: /Reveal Next/ }).click();
  await expect(page.getByText('Current Worth: 75 Points')).toBeVisible();
  await page.getByTestId('answer-option').first().click();
  await page.getByTestId('next-round').click();
  await expect(page.getByText('Round 2/10', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Quit Game' }).click();
  await page.getByRole('button', { name: 'Start Game' }).click();
  await expect(page.getByText('Round 1/10', { exact: true })).toBeVisible();
  await expect(page.getByText('Total Score: 0', { exact: true })).toBeVisible();
  await expect(page.getByText('Current Worth: 100 Points')).toBeVisible();

  await completeGameSession(page);
  await page.getByRole('button', { name: 'Play Again' }).click();
  await expect(page.getByText('Round 1/10', { exact: true })).toBeVisible();
  await expect(page.getByText('Total Score: 0', { exact: true })).toBeVisible();
  await expect(page.getByText('Current Worth: 100 Points')).toBeVisible();
  await expect(page.getByTestId('answer-option')).toHaveCount(4);
});

test('replay cancels the previous result screen redirect after score submission', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Game' }).click();
  await completeGameSession(page);

  await page.clock.install();
  await page.route('**/api/leaderboard', (route) => route.fulfill({
    status: 201,
    json: { id: 1, name: 'Replay', score: 0, createdAt: '2026-11-16T00:00:00Z' },
  }));
  await page.getByPlaceholder('Enter name (max 20 chars)').fill('Replay');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('✓ Score saved to leaderboard!')).toBeVisible();

  await page.getByRole('button', { name: 'Play Again' }).click();
  await page.clock.fastForward(1500);
  await expect(page.getByText('Round 1/10', { exact: true })).toBeVisible();
  await expect(page.getByText('Global High Scores')).toBeHidden();

  await completeGameSession(page);
  await page.getByRole('contentinfo').getByRole('button', { name: 'Privacy' }).click();
  await expect(page.getByRole('dialog', { name: 'Privacy' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Return to Home' }).click();
  await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible();
});

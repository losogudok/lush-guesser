import { expect, test } from '@playwright/test';

test('player can complete a game and submit a leaderboard score', async ({ page }) => {
  const displayName = `Playwright${Date.now().toString().slice(-6)}`;

  await page.goto('/');

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

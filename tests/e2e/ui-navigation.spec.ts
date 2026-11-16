import { expect, test } from '@playwright/test';

test('navigation derives the active tab and shared modals work across screens', async ({ page }) => {
  await page.route('**/api/leaderboard?limit=20', (route) => route.fulfill({ json: [] }));
  await page.goto('/');

  const playTab = page.getByRole('navigation').getByRole('button', { name: 'Play', exact: true });
  const leaderboardTab = page.getByRole('navigation').getByRole('button', { name: 'Leaderboard' });
  await expect(playTab).toHaveAttribute('aria-current', 'page');
  await expect(leaderboardTab).not.toHaveAttribute('aria-current');

  await page.getByRole('contentinfo').getByRole('button', { name: 'Terms' }).click();
  await expect(page.getByRole('dialog', { name: 'Terms' })).toBeVisible();
  await page.getByTitle('Close').click();
  await expect(page.getByRole('dialog')).toBeHidden();

  await leaderboardTab.click();
  await expect(page.getByText('Global High Scores')).toBeVisible();
  await expect(leaderboardTab).toHaveAttribute('aria-current', 'page');
  await expect(playTab).not.toHaveAttribute('aria-current');

  await page.getByRole('contentinfo').getByRole('button', { name: 'Privacy' }).click();
  await expect(page.getByRole('dialog', { name: 'Privacy' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(leaderboardTab).toHaveAttribute('aria-current', 'page');

  await page.getByRole('contentinfo').getByRole('button', { name: 'Contact' }).click();
  await expect(page.getByRole('dialog', { name: 'Contact' })).toBeVisible();
  await page.getByTitle('Close').click();

  await page.getByTitle('How to Play').click();
  await expect(page.getByRole('dialog', { name: 'How to Play' })).toBeVisible();
  await page.keyboard.press('Escape');

  await playTab.click();
  await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible();
  await expect(playTab).toHaveAttribute('aria-current', 'page');
  await expect(leaderboardTab).not.toHaveAttribute('aria-current');
  await expect(page.getByRole('dialog')).toBeHidden();
});

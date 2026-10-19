import { test, expect } from '@playwright/test';

test('player can go to leaderboard and see their score', async ({ page }) => {
  await page.route('*/**/api/leaderboard?limit=20', async route => {
    const json = [{"id":1,"name":"Testing","score":300,"createdAt":"2026-10-17T22:08:45.000Z"}];
    await route.fulfill({ json });
  });

  await page.goto('/');

  await page.getByText('Leaderboard').click();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByRole('cell', { name: '1', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Testing' })).toBeVisible();
  await expect(page.getByRole('cell', { name: '300' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Oct 18, 2026' })).toBeVisible();
});

test('if leaderboard is empty', async ({ page }) => {
  await page.route('*/**/api/leaderboard?limit=20', async route => {
    const json = [];
    await route.fulfill({ json });
  });

  await page.goto('/');

  await page.getByText('Leaderboard').click();
  await expect(page.getByText('No scores recorded yet')).toBeVisible();
  await expect(page.getByRole('table')).toBeHidden();
});

test('if leaderboard got error', async ({ page }) => {
  await page.route('*/**/api/leaderboard?limit=20', async route => {
    await route.abort('connectionfailed');
  });

  await page.goto('/');

  await page.getByText('Leaderboard').click();
  await expect(page.getByText('Leaderboard unavailable')).toBeVisible();
  await expect(page.getByRole('table')).toBeHidden();
  await expect(page.getByText('No scores recorded yet')).toBeHidden();
});
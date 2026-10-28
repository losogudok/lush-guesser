import { expect, test } from '@playwright/test';

test('reveals every ingredient without rendering an empty card', async ({ page }) => {
  const pageErrors: string[] = [];

  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');
  await page.getByRole('button', { name: 'START GAME' }).click();

  for (let round = 0; round < 2; round += 1) {
    let revealedClueCount = 1;
    const revealButton = page.getByRole('button', { name: /Reveal Next/ });
    const clueImages = page
      .getByRole('region', { name: 'Ingredient clue carousel' })
      .locator('img');

    for (let reveal = 0; reveal < 3; reveal += 1) {
      if ((await revealButton.count()) === 0) break;
      await revealButton.click();
      revealedClueCount += 1;
      await expect(clueImages).toHaveCount(revealedClueCount);
    }

    await expect(revealButton).toHaveCount(0);
    await expect(clueImages).toHaveCount(revealedClueCount);
    expect(
      await clueImages.evaluateAll((images) =>
        images.every((image) => image.getAttribute('alt')?.trim()),
      ),
    ).toBe(true);

    await page.getByTestId('answer-option').first().click();
    await page.getByTestId('next-round').click();
  }

  expect(pageErrors).toEqual([]);
});

import assert from 'node:assert/strict';
import test from 'node:test';

import { productCatalog } from '../src/data/products';
import { catalogSeedSnapshot } from '../../server/src/catalog/seed-snapshot';

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

test('seed snapshot mirrors the frontend fallback Products, including clue order', () => {
  const frontendProducts = productCatalog.products.map((product) => ({
    slug: product.id,
    name: product.name,
    description: product.description,
    color: product.color,
    inGame: true,
    clues: product.ingredients.map((ingredient) => slugify(ingredient)),
  }));

  assert.deepEqual(catalogSeedSnapshot.products, frontendProducts);
});

test('seed snapshot covers every clued Ingredient with its frontend image path', () => {
  const frontendIngredientImages = new Map<string, string>();
  for (const product of productCatalog.products) {
    for (const ingredient of product.ingredients) {
      const slug = slugify(ingredient);
      if (!frontendIngredientImages.has(slug)) {
        frontendIngredientImages.set(slug, productCatalog.getIngredientImage(ingredient));
      }
    }
  }

  const snapshotById = new Map(
    catalogSeedSnapshot.ingredients.map((ingredient) => [ingredient.slug, ingredient]),
  );

  for (const [slug, imagePath] of frontendIngredientImages) {
    const seeded = snapshotById.get(slug);
    assert.ok(seeded, `seed snapshot is missing Ingredient: ${slug}`);
    assert.equal(seeded.imagePath, imagePath);
  }
});

test('seed snapshot keeps localized names for every Ingredient', () => {
  for (const ingredient of catalogSeedSnapshot.ingredients) {
    assert.ok(ingredient.name.en.trim());
    assert.ok(ingredient.name.ru.trim());
  }
});

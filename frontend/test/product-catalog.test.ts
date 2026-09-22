import assert from 'node:assert/strict';
import test from 'node:test';

import { productCatalog } from '../src/data/products';

test('exposes only playable Products through the validated catalog', () => {
  assert.ok(productCatalog.products.length >= 12);

  for (const product of productCatalog.products) {
    assert.ok(product.ingredients.length >= 2);
    assert.ok(product.ingredients.length <= 4);
    assert.match(product.color, /^#[0-9a-f]{6}$/i);
    assert.ok(product.name.en.trim());
    assert.ok(product.name.ru.trim());
    assert.ok(product.description.en.trim());
    assert.ok(product.description.ru.trim());

    for (const ingredient of product.ingredients) {
      assert.match(
        productCatalog.getIngredientImage(ingredient),
        /^\/images\/ingredients\/.+\.png$/,
      );
    }
  }
});

test('fails explicitly for an unknown Ingredient Clue image', () => {
  assert.throws(
    () => productCatalog.getIngredientImage('Unknown Ingredient'),
    /Unknown Ingredient Clue image: Unknown Ingredient/,
  );
});

test('fails validation when an Ingredient Clue image is missing', () => {
  const missingImage = productCatalog.getIngredientImage('Rose');

  assert.throws(
    () => productCatalog.validateAssets((imagePath) => imagePath !== missingImage),
    /Ingredient Clue image is missing: Rose/,
  );
});

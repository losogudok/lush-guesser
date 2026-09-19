import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getIngredientImage, hasIngredientImage, products } from '../src/data/products';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const errors: string[] = [];
const ids = new Set<string>();

if (products.length < 12) {
  errors.push(`Expected at least 12 products, found ${products.length}.`);
}

for (const product of products) {
  if (ids.has(product.id)) {
    errors.push(`Duplicate product id: ${product.id}`);
  }
  ids.add(product.id);

  if (!product.name.en || !product.name.ru) {
    errors.push(`${product.id} is missing localized names.`);
  }

  if (!product.description.en || !product.description.ru) {
    errors.push(`${product.id} is missing localized descriptions.`);
  }

  if (product.ingredients.length !== 4) {
    errors.push(`${product.id} must have exactly 4 ingredients.`);
  }

  for (const ingredient of product.ingredients) {
    if (!hasIngredientImage(ingredient)) {
      errors.push(`${product.id} ingredient has no image mapping: ${ingredient}`);
      continue;
    }

    const imagePath = getIngredientImage(ingredient).replace(/^\//, '');
    if (!existsSync(join(publicDir, imagePath))) {
      errors.push(`${product.id} ingredient image is missing on disk: ${ingredient} -> ${imagePath}`);
    }
  }

  if (!/^#[0-9a-f]{6}$/i.test(product.color)) {
    errors.push(`${product.id} has invalid color: ${product.color}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

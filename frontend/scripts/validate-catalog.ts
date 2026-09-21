import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { productCatalog } from '../src/data/products';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

productCatalog.validateAssets((imagePath) =>
  existsSync(join(publicDir, imagePath.replace(/^\//, ''))),
);

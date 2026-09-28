import { DataSource } from 'typeorm';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { CatalogSeeder } from './catalog-seeder';
import { copyStarterImages } from './starter-images';
import { catalogSeedSnapshot } from './seed-snapshot';
import {
  DATABASE_ENTITIES,
  DATABASE_MIGRATIONS,
  resolveDatabasePath,
} from '../database';

/** Image volume location; configurable so each environment owns its volume. */
const resolveImageVolumePath = (): string =>
  process.env.IMAGE_VOLUME_PATH ?? path.join(process.cwd(), 'data', 'images');

/** Starter image files bundled with the server build. */
const resolveStarterImagesSource = (): string =>
  path.resolve(__dirname, '..', '..', 'assets', 'starter-images');

/**
 * Runs the one-time catalog seed: copies starter ingredient images into
 * the image volume and imports the seed snapshot into the database.
 * Safe to run repeatedly; existing rows and files are left untouched.
 */
const main = async (): Promise<void> => {
  const imageVolumePath = resolveImageVolumePath();
  const starterImagesSource = resolveStarterImagesSource();

  const starterImageFiles = catalogSeedSnapshot.ingredients
    .map((ingredient) =>
      ingredient.imagePath ? path.basename(ingredient.imagePath) : null,
    )
    .filter((file): file is string => file !== null);

  try {
    await fs.access(starterImagesSource);
  } catch {
    throw new Error(
      `Starter images not found at ${starterImagesSource}; the seed expects the bundled asset set.`,
    );
  }

  console.log('[seed] Copying starter ingredient images to the image volume…');
  await copyStarterImages(
    starterImagesSource,
    imageVolumePath,
    starterImageFiles,
  );
  console.log(
    `[seed] Starter images ready in the image volume at ${imageVolumePath}.`,
  );

  const databasePath = resolveDatabasePath();
  console.log(`[seed] Connecting to the database at ${databasePath}…`);
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: databasePath,
    entities: [...DATABASE_ENTITIES],
    migrations: [...DATABASE_MIGRATIONS],
  });
  await dataSource.initialize();

  console.log('[seed] Running pending migrations…');
  await dataSource.runMigrations({ transaction: 'each' });

  console.log('[seed] Seeding catalog snapshot…');
  await new CatalogSeeder(dataSource).seed(catalogSeedSnapshot);

  console.log(
    '[seed] Catalog seeded. The database is now the source of truth.',
  );
  await dataSource.destroy();
};

void main().catch((error) => {
  console.error('[seed] Failed:', error);
  process.exitCode = 1;
});

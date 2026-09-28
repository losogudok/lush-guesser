import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Ingredient } from './catalog/ingredient.entity';
import { Product } from './catalog/product.entity';
import { ProductIngredientClue } from './catalog/product-ingredient-clue.entity';
import { LeaderboardEntry } from './leaderboard/leaderboard.entity';
import { CreateLeaderboard1710000000000 } from './migrations/1710000000000-CreateLeaderboard';
import { CreateCatalog1710000001000 } from './migrations/1710000001000-CreateCatalog';

/**
 * Resolved at the moment the database is opened, not at module import time,
 * so tests can point each run at its own temporary database file.
 */
export const resolveDatabasePath = (): string =>
  process.env.DATABASE_PATH ?? 'database.sqlite';

export const DATABASE_ENTITIES = [
  LeaderboardEntry,
  Product,
  Ingredient,
  ProductIngredientClue,
] as const;

export const DATABASE_MIGRATIONS = [
  CreateLeaderboard1710000000000,
  CreateCatalog1710000001000,
] as const;

/** TypeORM options shared by the running app and the seed CLI. */
export const buildTypeOrmOptions = (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    type: 'better-sqlite3',
    database: resolveDatabasePath(),
    entities: [...DATABASE_ENTITIES],
    migrations: [...DATABASE_MIGRATIONS],
    migrationsRun: isProduction,
    synchronize: !isProduction,
  };
};

import { DataSource } from 'typeorm';
import { CatalogService } from './catalog.service';
import { CatalogSeeder } from './catalog-seeder';
import { Ingredient } from './ingredient.entity';
import { Product } from './product.entity';
import { ProductIngredientClue } from './product-ingredient-clue.entity';
import { catalogSeedSnapshot } from './seed-snapshot';

/**
 * Integration check against a real SQLite database: the seeder turns an
 * empty database into the catalog the game endpoint serves, matching the
 * seed snapshot (which the frontend drift guard ties to the fallback
 * snapshot).
 */
describe('CatalogSeeder against a real database', () => {
  let dataSource: DataSource;

  const createService = (): CatalogService =>
    new CatalogService(
      dataSource.getRepository(Product),
      dataSource.getRepository(Ingredient),
      dataSource,
    );

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [Product, Ingredient, ProductIngredientClue],
      synchronize: true,
    });
    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('fills an empty database so the catalog service returns the snapshot', async () => {
    await new CatalogSeeder(dataSource).seed(catalogSeedSnapshot);

    const service = createService();
    const catalog = await service.getGameCatalog();
    const ingredients = await service.getAllIngredients();

    expect(ingredients.map((ingredient) => ingredient.slug)).toEqual(
      catalogSeedSnapshot.ingredients.map((ingredient) => ingredient.slug),
    );
    expect(ingredients.every((ingredient) => ingredient.imagePath)).toBe(true);

    expect(catalog.map((product) => product.slug)).toEqual(
      catalogSeedSnapshot.products.map((product) => product.slug),
    );

    catalog.forEach((product, index) => {
      const seeded = catalogSeedSnapshot.products[index];
      expect(product.name).toEqual(seeded.name);
      expect(product.description).toEqual(seeded.description);
      expect(product.color).toBe(seeded.color);
      expect(product.inGame).toBe(seeded.inGame);
      expect(product.clues.map((clue) => clue.ingredient.slug)).toEqual(
        seeded.clues,
      );
      expect(product.clues.every((clue) => clue.ingredient.imagePath)).toBe(
        true,
      );
    });
  });

  it('is idempotent on the real database: re-seeding changes nothing', async () => {
    await new CatalogSeeder(dataSource).seed(catalogSeedSnapshot);

    const counts = async (): Promise<{
      ingredients: number;
      products: number;
      clues: number;
    }> => ({
      ingredients: await dataSource.getRepository(Ingredient).count(),
      products: await dataSource.getRepository(Product).count(),
      clues: await dataSource.getRepository(ProductIngredientClue).count(),
    });
    const before = await counts();

    await new CatalogSeeder(dataSource).seed(catalogSeedSnapshot);

    expect(await counts()).toEqual(before);
  });
});

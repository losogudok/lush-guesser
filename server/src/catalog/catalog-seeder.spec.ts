import { DataSource } from 'typeorm';
import { EntityManager } from 'typeorm';
import { Ingredient } from './ingredient.entity';
import { Product } from './product.entity';
import { ProductIngredientClue } from './product-ingredient-clue.entity';
import { CatalogSeeder } from './catalog-seeder';
import { catalogSeedSnapshot } from './seed-snapshot';

interface MemoryStore {
  ingredients: Ingredient[];
  products: Product[];
  clues: ProductIngredientClue[];
  /** EntityManager standing in for the transaction-scoped manager. */
  manager: () => EntityManager;
}

/** Slim in-memory stand-ins for the TypeORM repositories and manager. */
const createMemoryStore = (): MemoryStore => {
  let ingredientId = 0;
  let productId = 0;
  const ingredients: Ingredient[] = [];
  const products: Product[] = [];
  const clues: ProductIngredientClue[] = [];

  const createIngredient = (entity: Partial<Ingredient>): Ingredient => ({
    id: 0,
    slug: entity.slug as string,
    name: entity.name as Ingredient['name'],
    imagePath: entity.imagePath ?? null,
  });

  const createProduct = (entity: Partial<Product>): Product => ({
    id: 0,
    slug: entity.slug as string,
    name: entity.name as Product['name'],
    description: entity.description as Product['description'],
    color: entity.color as string,
    inGame: entity.inGame ?? true,
  });

  const createClue = (
    entity: Partial<ProductIngredientClue>,
  ): ProductIngredientClue => ({
    id: 0,
    productId: entity.productId as number,
    position: entity.position as number,
    ingredientId: entity.ingredientId as number,
  });

  const manager = () =>
    ({
      transaction: (
        work: (manager: EntityManager) => Promise<void>,
      ): Promise<void> => work(manager()),
      getRepository: (target: unknown) => {
        if (target === Product) {
          return {
            create: createProduct,
            findOne: ({ where }: { where: { slug: string } }) =>
              Promise.resolve(
                products.find((product) => product.slug === where.slug) ?? null,
              ),
            save: (entity: Partial<Product>) => {
              const saved = { ...createProduct(entity), id: ++productId };
              products.push(saved);
              return Promise.resolve(saved);
            },
          };
        }
        if (target === Ingredient) {
          return {
            create: createIngredient,
            findOne: ({ where }: { where: { slug: string } }) =>
              Promise.resolve(
                ingredients.find(
                  (ingredient) => ingredient.slug === where.slug,
                ) ?? null,
              ),
            save: (entity: Partial<Ingredient>) => {
              const saved = { ...createIngredient(entity), id: ++ingredientId };
              ingredients.push(saved);
              return Promise.resolve(saved);
            },
          };
        }
        if (target === ProductIngredientClue) {
          return {
            create: createClue,
            save: (entities: ProductIngredientClue[]) => {
              clues.push(...entities);
              return Promise.resolve(entities);
            },
          };
        }
        throw new Error(`Unexpected repository target: ${String(target)}`);
      },
    }) as unknown as EntityManager;

  return { ingredients, products, clues, manager };
};

describe('CatalogSeeder', () => {
  it('creates Products, Ingredients, and ordered Ingredient Clues from the seed snapshot', async () => {
    const store = createMemoryStore();
    const seeder = new CatalogSeeder(store.manager() as unknown as DataSource);

    await seeder.seed(catalogSeedSnapshot);

    expect(store.ingredients).toHaveLength(
      catalogSeedSnapshot.ingredients.length,
    );
    expect(store.products).toHaveLength(catalogSeedSnapshot.products.length);

    const confetti = store.products.find(
      (product) => product.slug === 'confetti',
    );
    expect(confetti?.color).toBe('#A779B8');
    expect(confetti?.inGame).toBe(true);

    const confettiClues = store.clues
      .filter((clue) => clue.productId === confetti?.id)
      .sort((a, b) => a.position - b.position);
    const confettiClueSlugs = confettiClues.map(
      (clue) =>
        store.ingredients.find(
          (ingredient) => ingredient.id === clue.ingredientId,
        )?.slug,
    );
    expect(confettiClueSlugs).toEqual(['rose', 'sandalwood', 'violet']);
  });

  it('is idempotent: nothing is created on a second run', async () => {
    const store = createMemoryStore();
    const seeder = new CatalogSeeder(store.manager() as unknown as DataSource);

    await seeder.seed(catalogSeedSnapshot);
    const ingredientCount = store.ingredients.length;
    const productCount = store.products.length;
    const clueCount = store.clues.length;

    await seeder.seed(catalogSeedSnapshot);

    expect(store.ingredients).toHaveLength(ingredientCount);
    expect(store.products).toHaveLength(productCount);
    expect(store.clues).toHaveLength(clueCount);
  });

  it('creates missing Ingredients even when Products already exist', async () => {
    const store = createMemoryStore();
    const seeder = new CatalogSeeder(store.manager() as unknown as DataSource);

    await seeder.seed({
      ingredients: catalogSeedSnapshot.ingredients,
      products: [],
    });

    expect(store.ingredients).toHaveLength(
      catalogSeedSnapshot.ingredients.length,
    );
    expect(store.products).toHaveLength(0);
    expect(store.clues).toHaveLength(0);
  });

  it('carries an image path for every starter Ingredient', () => {
    const unmapped = catalogSeedSnapshot.ingredients.filter(
      (ingredient) => !ingredient.imagePath,
    );
    expect(unmapped).toEqual([]);
  });
});

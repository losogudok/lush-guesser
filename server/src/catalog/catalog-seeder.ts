import { DataSource, EntityManager } from 'typeorm';
import { Ingredient } from './ingredient.entity';
import { Product } from './product.entity';
import { ProductIngredientClue } from './product-ingredient-clue.entity';
import type { CatalogSeedSnapshot } from './seed-snapshot';

/**
 * One-time seed importer for the catalog snapshot. Idempotent: existing
 * Products and Ingredients (matched by slug) are left untouched, missing
 * ones are created, and each new Product gets its ordered Ingredient
 * Clues. Everything runs inside one transaction.
 */
export class CatalogSeeder {
  constructor(private readonly dataSource: DataSource) {}

  async seed(snapshot: CatalogSeedSnapshot): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await this.seedIngredients(manager, snapshot.ingredients);
      await this.seedProducts(manager, snapshot.products);
    });
  }

  /** Creates Ingredients by slug; existing Ingredients keep their data. */
  private async seedIngredients(
    manager: EntityManager,
    entries: CatalogSeedSnapshot['ingredients'],
  ): Promise<void> {
    for (const entry of entries) {
      const existing = await manager
        .getRepository(Ingredient)
        .findOne({ where: { slug: entry.slug } });
      if (existing) {
        continue;
      }
      await manager.getRepository(Ingredient).save(
        manager.getRepository(Ingredient).create({
          slug: entry.slug,
          name: entry.name,
          imagePath: entry.imagePath ?? null,
        }),
      );
    }
  }

  /**
   * Creates missing Products and attaches their ordered Ingredient
   * Clues. Existing Products are never modified.
   */
  private async seedProducts(
    manager: EntityManager,
    entries: CatalogSeedSnapshot['products'],
  ): Promise<void> {
    for (const entry of entries) {
      const existing = await manager
        .getRepository(Product)
        .findOne({ where: { slug: entry.slug } });
      if (existing) {
        continue;
      }

      const product = await manager.getRepository(Product).save(
        manager.getRepository(Product).create({
          slug: entry.slug,
          name: entry.name,
          description: entry.description,
          color: entry.color,
          inGame: entry.inGame,
        }),
      );

      await this.saveOrderedClues(manager, product, entry.clues);
    }
  }

  /** Resolves Ingredient slugs to rows and writes the reveal order. */
  private async saveOrderedClues(
    manager: EntityManager,
    product: Product,
    clueSlugs: string[],
  ): Promise<void> {
    const clueRepository = manager.getRepository(ProductIngredientClue);
    const clues: ProductIngredientClue[] = [];

    for (const [position, slug] of clueSlugs.entries()) {
      const ingredient = await manager
        .getRepository(Ingredient)
        .findOne({ where: { slug } });
      if (!ingredient) {
        throw new Error(
          `Seed error: Product ${product.slug} references missing Ingredient ${slug}.`,
        );
      }
      clues.push(
        clueRepository.create({
          productId: product.id,
          position,
          ingredientId: ingredient.id,
        }),
      );
    }

    await clueRepository.save(clues);
  }
}

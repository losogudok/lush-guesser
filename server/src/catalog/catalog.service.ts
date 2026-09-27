import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Like, Repository } from 'typeorm';
import { Ingredient } from './ingredient.entity';
import { Product } from './product.entity';
import { ProductIngredientClue } from './product-ingredient-clue.entity';
import { validateProductCandidate, isStringArray } from './catalog-validation';
import { LocalizedText, isNonEmptyLocalizedText } from './localized-text';
import { slugify } from './slug';

/** Raw, unvalidated Product submission; the service validates before persisting. */
export interface CreateProductInput {
  name: unknown;
  description: unknown;
  color: unknown;
  clues: unknown;
  inGame?: unknown;
}

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    private readonly dataSource: DataSource,
  ) {}

  async getGameCatalog(): Promise<Product[]> {
    const products = await this.productRepository.find({
      where: { inGame: true },
      relations: { clues: { ingredient: true } },
      order: { id: 'ASC' },
    });

    for (const product of products) {
      product.clues.sort((a, b) => a.position - b.position);
    }

    return products;
  }

  async getAllIngredients(): Promise<Ingredient[]> {
    return this.ingredientRepository.find({ order: { id: 'ASC' } });
  }

  /** Creates an Ingredient with a slug generated from its English name. */
  async createIngredient(
    name: unknown,
    imagePath?: string,
  ): Promise<Ingredient> {
    if (!isNonEmptyLocalizedText(name)) {
      throw new BadRequestException(
        'Ingredient is missing localized (en and ru) name fields.',
      );
    }

    const slug = slugify(name.en);
    if (!slug) {
      throw new BadRequestException(
        'Ingredient requires an English name to generate a slug.',
      );
    }

    const existing = await this.ingredientRepository.findOne({
      where: { slug },
    });
    if (existing) {
      throw new BadRequestException(
        `Ingredient already exists with slug: ${slug}.`,
      );
    }

    return this.ingredientRepository.save(
      this.ingredientRepository.create({
        slug,
        name,
        imagePath: imagePath ?? null,
      }),
    );
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    return this.dataSource.transaction(async (manager) => {
      // A malformed clue list is rejected by validation below without a query.
      const ingredients = isStringArray(input.clues)
        ? await this.resolveIngredients(manager, input.clues)
        : [];
      const knownIngredientSlugs = new Set(
        ingredients.map((ingredient) => ingredient.slug),
      );
      const errors = validateProductCandidate(input, knownIngredientSlugs);
      if (errors.length > 0) {
        throw new BadRequestException(`Invalid Product:\n${errors.join('\n')}`);
      }

      // Validation passed, so the candidate fields hold safe values.
      const candidate = input as {
        name: LocalizedText;
        description: LocalizedText;
        color: string;
        clues: string[];
      };

      const slug = await this.generateUniqueProductSlug(
        manager,
        candidate.name.en,
      );

      const product = await manager.getRepository(Product).save(
        manager.getRepository(Product).create({
          slug,
          name: candidate.name,
          description: candidate.description,
          color: candidate.color,
          inGame: input.inGame === undefined ? true : (input.inGame as boolean),
        }),
      );

      await this.saveOrderedClues(manager, product, ingredients);

      const saved = await manager.getRepository(Product).findOne({
        where: { id: product.id },
        relations: { clues: { ingredient: true } },
      });
      return saved as Product;
    });
  }

  /** Resolves clue slugs to Ingredients in reveal order. */
  private async resolveIngredients(
    manager: EntityManager,
    slugs: string[],
  ): Promise<Ingredient[]> {
    if (slugs.length === 0) {
      return [];
    }

    const ingredients = await manager
      .getRepository(Ingredient)
      .find({ where: { slug: In(slugs) } });

    return slugs
      .map((slug) => ingredients.find((ingredient) => ingredient.slug === slug))
      .filter(
        (ingredient): ingredient is Ingredient => ingredient !== undefined,
      );
  }

  private async generateUniqueProductSlug(
    manager: EntityManager,
    baseName: string,
  ): Promise<string> {
    const baseSlug = slugify(baseName) || 'product';
    const productRepository = manager.getRepository(Product);
    const taken = new Set(
      (
        await productRepository.find({
          where: { slug: Like(`${baseSlug}%`) },
          select: ['slug'],
        })
      ).map((product) => product.slug),
    );

    if (!taken.has(baseSlug)) {
      return baseSlug;
    }

    let suffix = 2;
    while (taken.has(`${baseSlug}-${suffix}`)) {
      suffix += 1;
    }
    return `${baseSlug}-${suffix}`;
  }

  private async saveOrderedClues(
    manager: EntityManager,
    product: Product,
    orderedIngredients: Ingredient[],
  ): Promise<void> {
    const clueRepository = manager.getRepository(ProductIngredientClue);
    const clues = clueRepository.create(
      orderedIngredients.map((ingredient, index) => ({
        productId: product.id,
        position: index,
        ingredientId: ingredient.id,
      })),
    );
    await clueRepository.save(clues);
  }
}

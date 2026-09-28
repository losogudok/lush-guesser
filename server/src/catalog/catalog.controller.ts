import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { AdminPasswordGuard } from './admin-password.guard';
import { Product } from './product.entity';
import type { LocalizedText } from './localized-text';

export interface CatalogClue {
  slug: string;
  name: LocalizedText;
  imagePath: string | null;
}

export interface CatalogProduct {
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  color: string;
  inGame: boolean;
  /** Ingredient Clues in reveal order; the first clue is revealed from the start. */
  clues: CatalogClue[];
}

export type CatalogIngredient = CatalogClue;

const toCatalogRef = (ref: {
  slug: string;
  name: LocalizedText;
  imagePath: string | null;
}): CatalogClue => ({
  slug: ref.slug,
  name: ref.name,
  imagePath: ref.imagePath ?? null,
});

const toCatalogProduct = (product: Product): CatalogProduct => ({
  slug: product.slug,
  name: product.name,
  description: product.description,
  color: product.color,
  inGame: product.inGame,
  clues: product.clues.map((clue) => toCatalogRef(clue.ingredient)),
});

@Controller('api/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  /** Read-only catalog for the game: in-game Products with ordered Ingredient Clues. */
  @Get()
  async getGameCatalog(): Promise<CatalogProduct[]> {
    const products = await this.catalogService.getGameCatalog();
    return products.map(toCatalogProduct);
  }

  @Get('ingredients')
  async getIngredients(): Promise<CatalogIngredient[]> {
    const ingredients = await this.catalogService.getAllIngredients();
    return ingredients.map(toCatalogRef);
  }

  /**
   * Admin-facing Product creation, guarded by the shared admin secret
   * (header `x-admin-password` matching `ADMIN_PASSWORD`) until proper
   * admin auth ships in #20. The API rejects invalid catalog data:
   * an admin panel cannot fix what the API accepts. Validation happens in
   * CatalogService; raw unvalidated fields are passed through untouched.
   */
  @Post('products')
  @UseGuards(AdminPasswordGuard)
  async createProduct(
    @Body()
    body: {
      name: unknown;
      description: unknown;
      color: unknown;
      clues: unknown;
      inGame?: unknown;
    },
  ): Promise<CatalogProduct> {
    const product = await this.catalogService.createProduct({
      name: body.name,
      description: body.description,
      color: body.color,
      clues: body.clues,
      inGame: body.inGame,
    });
    return toCatalogProduct(product);
  }
}

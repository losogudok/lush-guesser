import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { Ingredient } from './ingredient.entity';
import { Product } from './product.entity';
import { ProductIngredientClue } from './product-ingredient-clue.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Ingredient, ProductIngredientClue]),
  ],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}

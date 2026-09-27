import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Product } from './product.entity';
import { Ingredient } from './ingredient.entity';

@Entity('product_ingredient_clue')
@Unique('UQ_product_clue_position', ['productId', 'position'])
@Index('IDX_product_clue_product', ['productId'])
export class ProductIngredientClue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  productId: number;

  @Column('int')
  position: number;

  @ManyToOne(() => Product, (product) => product.clues, {
    onDelete: 'CASCADE',
  })
  product: Product;

  @Column('int')
  ingredientId: number;

  @ManyToOne(() => Ingredient, { onDelete: 'RESTRICT' })
  ingredient: Ingredient;
}

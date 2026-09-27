import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProductIngredientClue } from './product-ingredient-clue.entity';
import type { LocalizedText } from './localized-text';

@Entity('product')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  /** URL-friendly identifier, generated at creation and immutable. */
  @Column({ unique: true })
  slug: string;

  @Column('simple-json')
  name: LocalizedText;

  @Column('simple-json')
  description: LocalizedText;

  /** Hex display color like #A779B8. */
  @Column()
  color: string;

  @Column({ default: true })
  inGame: boolean;

  /** Ingredient Clues in reveal order: the first clue is revealed from the start. */
  @OneToMany(() => ProductIngredientClue, (clue) => clue.product, {
    cascade: true,
  })
  clues: ProductIngredientClue[];
}

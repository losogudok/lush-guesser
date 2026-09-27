import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { LocalizedText } from './localized-text';

@Entity('ingredient')
export class Ingredient {
  @PrimaryGeneratedColumn()
  id: number;

  /** URL-friendly identifier, generated from the English name and immutable. */
  @Column({ unique: true })
  slug: string;

  @Column('simple-json')
  name: LocalizedText;

  /** Path of the ingredient image served by the backend, if any. */
  @Column({ type: 'varchar', nullable: true })
  imagePath: string | null;
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCatalog1710000001000 implements MigrationInterface {
  name = 'CreateCatalog1710000001000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ingredient" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "slug" varchar NOT NULL,
        "name" simple_json NOT NULL,
        "imagePath" varchar NULL,
        CONSTRAINT "UQ_ingredient_slug" UNIQUE ("slug")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "slug" varchar NOT NULL,
        "name" simple_json NOT NULL,
        "description" simple_json NOT NULL,
        "color" varchar NOT NULL,
        "inGame" boolean NOT NULL DEFAULT (1),
        CONSTRAINT "UQ_product_slug" UNIQUE ("slug")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_ingredient_clue" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "productId" integer NOT NULL,
        "position" integer NOT NULL,
        "ingredientId" integer NOT NULL,
        CONSTRAINT "UQ_product_clue_position" UNIQUE ("productId", "position"),
        CONSTRAINT "FK_product_clue_product" FOREIGN KEY ("productId") REFERENCES "product" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_product_clue_ingredient" FOREIGN KEY ("ingredientId") REFERENCES "ingredient" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_product_clue_product" ON "product_ingredient_clue" ("productId")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "product_ingredient_clue"');
    await queryRunner.query('DROP TABLE IF EXISTS "product"');
    await queryRunner.query('DROP TABLE IF EXISTS "ingredient"');
  }
}

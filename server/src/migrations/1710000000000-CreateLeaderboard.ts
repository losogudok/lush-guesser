import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLeaderboard1710000000000 implements MigrationInterface {
  name = 'CreateLeaderboard1710000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "leaderboard" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" varchar NOT NULL,
        "score" integer NOT NULL,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "leaderboard"');
  }
}

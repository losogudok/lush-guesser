import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from './catalog/catalog.module';
import { Ingredient } from './catalog/ingredient.entity';
import { Product } from './catalog/product.entity';
import { ProductIngredientClue } from './catalog/product-ingredient-clue.entity';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { LeaderboardEntry } from './leaderboard/leaderboard.entity';
import { CreateLeaderboard1710000000000 } from './migrations/1710000000000-CreateLeaderboard';
import { CreateCatalog1710000001000 } from './migrations/1710000001000-CreateCatalog';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const isProduction = process.env.NODE_ENV === 'production';

        return {
          type: 'sqlite',
          database: process.env.DATABASE_PATH ?? 'database.sqlite',
          entities: [
            LeaderboardEntry,
            Product,
            Ingredient,
            ProductIngredientClue,
          ],
          migrations: [
            CreateLeaderboard1710000000000,
            CreateCatalog1710000001000,
          ],
          migrationsRun: isProduction,
          synchronize: !isProduction,
        };
      },
    }),
    LeaderboardModule,
    CatalogModule,
    TelegramModule,
  ],
})
export class AppModule {}

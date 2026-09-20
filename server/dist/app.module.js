"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const leaderboard_module_1 = require("./leaderboard/leaderboard.module");
const leaderboard_entity_1 = require("./leaderboard/leaderboard.entity");
const _1710000000000_CreateLeaderboard_1 = require("./migrations/1710000000000-CreateLeaderboard");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRootAsync({
                useFactory: () => {
                    const isProduction = process.env.NODE_ENV === 'production';
                    return {
                        type: 'sqlite',
                        database: process.env.DATABASE_PATH ?? 'database.sqlite',
                        entities: [leaderboard_entity_1.LeaderboardEntry],
                        migrations: [_1710000000000_CreateLeaderboard_1.CreateLeaderboard1710000000000],
                        migrationsRun: isProduction,
                        synchronize: !isProduction,
                    };
                },
            }),
            leaderboard_module_1.LeaderboardModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
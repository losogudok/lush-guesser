"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaderboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const leaderboard_entity_1 = require("./leaderboard.entity");
let LeaderboardService = class LeaderboardService {
    leaderboardRepository;
    constructor(leaderboardRepository) {
        this.leaderboardRepository = leaderboardRepository;
    }
    async getTopScores(limit = 10) {
        return this.leaderboardRepository.find({
            order: { score: 'DESC', createdAt: 'ASC' },
            take: limit,
        });
    }
    async addScore(name, score) {
        const entry = this.leaderboardRepository.create({ name, score });
        return this.leaderboardRepository.save(entry);
    }
};
exports.LeaderboardService = LeaderboardService;
exports.LeaderboardService = LeaderboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(leaderboard_entity_1.LeaderboardEntry)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], LeaderboardService);
//# sourceMappingURL=leaderboard.service.js.map
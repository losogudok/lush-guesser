# Tech Context: Lush Scent Guesser

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | ^19.2.6 | UI framework |
| TypeScript | ~6.0.2 | Type safety |
| Vite | ^8.0.12 | Build tool / dev server |
| Tailwind CSS | ^4.3.0 | Utility-first styling |
| i18next | ^26.3.0 | Internationalization |
| react-i18next | ^17.0.8 | React i18n bindings |
| canvas-confetti | ^1.9.4 | Confetti animations |
| lucide-react | ^1.17.0 | Icon library |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| NestJS | ^11.0.1 | Node.js framework |
| TypeScript | ^5.7.3 | Type safety |
| TypeORM | ^0.3.30 | ORM for SQLite |
| SQLite3 | ^5.1.7 | Embedded database |
| RxJS | ^7.8.1 | Reactive programming |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| Docker + Docker Compose | Containerization |
| Caddy | Production static file server (frontend) |
| Node.js 24 | Runtime (both frontend build and backend) |

## Development Setup

### Prerequisites
- Node.js 24+ (for local development)
- Docker & Docker Compose (for containerized deployment)

### Local Development (without Docker)
```bash
# Terminal 1 - Backend
cd server
npm install
npm run start:dev  # Runs on http://localhost:3001

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev        # Runs on http://localhost:5173, proxies /api to :3001
```

### Docker Deployment
```bash
docker-compose up --build
# Frontend: http://localhost:80
# Backend:  http://localhost:3001
```

## Project Structure
```
lush-guesser/
├── memory-bank/              # Project documentation (this dir)
├── data/
│   └── database.sqlite       # SQLite database (Docker volume)
├── docker-compose.yml        # Orchestrates frontend + backend
├── frontend/
│   ├── public/               # Static assets (images, icons)
│   ├── src/
│   │   ├── components/       # React components (4 screens)
│   │   ├── data/
│   │   │   └── products.ts   # Product catalog (6 products)
│   │   ├── i18n.ts           # i18n configuration
│   │   ├── App.tsx           # Root component
│   │   ├── main.tsx          # Entry point
│   │   └── index.css         # Global styles + Tailwind
│   ├── index.html
│   ├── vite.config.ts        # Vite config with /api proxy
│   ├── Dockerfile            # Multi-stage: Node build → Caddy serve
│   └── Caddyfile             # Static file server config
└── server/
    ├── src/
    │   ├── leaderboard/
    │   │   ├── leaderboard.controller.ts
    │   │   ├── leaderboard.service.ts
    │   │   ├── leaderboard.entity.ts
    │   │   └── leaderboard.module.ts
    │   ├── app.module.ts     # TypeORM + module imports
    │   └── main.ts           # NestJS bootstrap (CORS enabled)
    ├── test/                 # E2E tests
    ├── Dockerfile            # Multi-stage: build → production
    └── package.json
```

## Key Configuration Files

### Vite Dev Proxy (`frontend/vite.config.ts`)
```ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
}
```

### TypeORM SQLite (`server/src/app.module.ts`)
```ts
TypeOrmModule.forRoot({
  type: 'sqlite',
  database: process.env.DATABASE_PATH ?? 'database.sqlite',
  entities: [LeaderboardEntry],
  synchronize: true,  // Auto-creates schema (dev-friendly)
})
```

### Docker Compose Networking
- Frontend container (`lush-guesser-frontend`): port 80
- Backend container (`lush-guesser-backend`): port 3001
- Shared volume: `./data:/app/data` for SQLite persistence

## Dependencies & Constraints

### Frontend Constraints
- React 19 with StrictMode enabled
- Tailwind CSS v4 (uses `@import "tailwindcss"` and `@theme` syntax)
- ES modules only (`"type": "module"` in package.json)
- No routing library — screen state managed manually in App.tsx

### Backend Constraints
- NestJS 11 with Express platform
- SQLite via TypeORM (synchronize: true for auto-migration)
- CORS enabled for development
- PORT env var defaults to 3001

### Build Constraints
- Frontend: TypeScript compilation + Vite build → static files served by Caddy
- Backend: NestJS build → `dist/` → run with `node dist/main.js`
- SQLite requires native compilation (python3, make, g++ in build stage)

## Tool Usage Patterns
- **npm**: Package management in both frontend/ and server/
- **Vite**: `npm run dev` (dev), `npm run build` (production)
- **NestJS CLI**: `npm run start:dev` (watch mode), `nest build`
- **Docker**: `docker-compose up --build` for full stack
- **ESLint**: Linting in both projects (separate configs)

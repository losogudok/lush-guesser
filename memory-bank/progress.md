# Progress: Lush Scent Guesser

## What Works

### Core Game
- [x] Welcome screen with navigation, language toggle, and start CTA
- [x] 5-round game loop with random non-repeating product selection
- [x] Ingredient card reveal system (1→4 cards, -25 points per reveal)
- [x] 4-option multiple choice guessing
- [x] Real-time score tracking and round progression
- [x] Confetti animation on correct guesses
- [x] Shake animation on incorrect guesses
- [x] Game over screen with tiered performance titles
- [x] Score submission to leaderboard

### Leaderboard
- [x] Backend API: `GET /api/leaderboard` with limit parameter
- [x] Backend API: `POST /api/leaderboard` with validation
- [x] SQLite database with TypeORM entity
- [x] Frontend leaderboard display with rank styling
- [x] Offline fallback with mock data

### Internationalization
- [x] Full English and Russian translations
- [x] Browser language detection
- [x] localStorage persistence
- [x] Russian pluralization support (one/few/many)

### UI/UX
- [x] Responsive design (mobile + desktop)
- [x] Bold black-and-white aesthetic with neon accents
- [x] Custom fonts (Inter, Cabinet Grotesk, Georgia)
- [x] Custom scrollbar styling
- [x] Card flip and shake animations

### Infrastructure
- [x] Docker Compose setup (frontend + backend + SQLite volume)
- [x] Multi-stage Dockerfiles for both services
- [x] Vite dev proxy for `/api` routes
- [x] CORS enabled on backend

## What's Left to Build
- [ ] Help/How to Play modal (icon exists but is non-functional)
- [ ] User profile page (icon exists but is non-functional)
- [ ] Terms/Privacy/Support pages (footer links are `#`)
- [ ] Additional products to expand the catalog beyond 6 items
- [ ] Additional ingredient illustrations (currently 10 images mapped to 23 ingredients)
- [ ] Sound effects or music
- [ ] Animation polish (card flip transitions not fully implemented)
- [ ] E2E tests (test files exist but are boilerplate)

## Known Issues
- **No known critical bugs** — the application appears fully functional
- Leaderboard offline banner always shows mock data on error, which could confuse users if backend is temporarily down
- `synchronize: true` on TypeORM is convenient for development but not recommended for production migrations

## Evolution of Decisions
- **Initial**: Considered external i18n JSON files → **Decision**: Inline resources for simplicity and zero network requests
- **Initial**: Considered a global state library → **Decision**: Prop drilling is sufficient for 4 screens
- **Initial**: Considered PostgreSQL → **Decision**: SQLite for zero-config deployment
- **Initial**: Considered Nginx → **Decision**: Caddy for simpler configuration

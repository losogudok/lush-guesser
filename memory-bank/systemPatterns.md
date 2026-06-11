# System Patterns: Lush Scent Guesser

## Architecture Overview
Monorepo with two independent applications: a React SPA frontend and a NestJS REST API backend, containerized with Docker Compose.

```
┌─────────────┐      HTTP/REST       ┌─────────────┐
│   Frontend  │ ◄──────────────────► │   Backend   │
│  (React/Vite)│    /api/leaderboard  │  (NestJS)   │
└─────────────┘                      └──────┬──────┘
                                            │
                                            ▼
                                      ┌─────────────┐
                                      │   SQLite    │
                                      │  (TypeORM)  │
                                      └─────────────┘
```

## Component Relationships

### Frontend (React SPA)
- **App.tsx**: Root state manager. Holds `screen` state (`welcome` | `game` | `gameover` | `leaderboard`) and game results. Routes between screens via conditional rendering.
- **WelcomeScreen**: Landing page with navigation header, language toggle, hero CTA
- **GameScreen**: Core game logic — playlist generation, round management, scoring, guess handling, confetti/shake effects
- **GameOverScreen**: Results display, tier calculation, leaderboard submission form
- **LeaderboardScreen**: Fetches and displays leaderboard entries; offline fallback with mock data
- **i18n.ts**: i18next configuration with inline EN/RU translations, browser language detection, localStorage persistence

### Backend (NestJS)
- **AppModule**: Root module with TypeORM SQLite configuration
- **LeaderboardModule**: Feature module (Controller + Service + Entity)
- **LeaderboardController**: REST endpoints — `GET /api/leaderboard` and `POST /api/leaderboard`
- **LeaderboardService**: Business logic — getTopScores (sorted DESC), addScore
- **LeaderboardEntry**: TypeORM entity — id, name, score, createdAt

## Key Design Patterns

### State Management
- **Lifted State**: All screen navigation and game results managed in App.tsx; passed down via props
- **Local State**: Each screen manages its own internal state (form inputs, loading states, etc.)
- **No global state library**: Simple enough for prop drilling; no Redux/Zustand needed

### Data Flow
1. GameScreen generates random playlist and manages round state internally
2. On game end, final score and correct count bubble up to App.tsx via callback
3. App.tsx passes results to GameOverScreen
4. GameOverScreen POSTs score to `/api/leaderboard`
5. LeaderboardScreen GETs scores from `/api/leaderboard`

### API Design
- `GET /api/leaderboard?limit=N` → Returns top N entries sorted by score DESC, createdAt ASC
- `POST /api/leaderboard` → Body: `{ name: string, score: number }` → Returns created entry
- Input validation on both endpoints (name non-empty, score non-negative number)

### Styling Architecture
- **Tailwind CSS v4** with custom theme tokens (`lush-black`, `lush-green`, `lush-yellow`, etc.)
- **Utility-first**: All styling via Tailwind classes; minimal custom CSS (animations only)
- **Component-scoped**: No CSS modules; relies on Tailwind's atomic classes
- **Custom animations**: Shake animation for incorrect guesses (defined in index.css)

### Internationalization
- i18next with react-i18next
- Inline resource objects (not external JSON files)
- Custom pluralization for Russian (one/few/many)
- Language persisted to localStorage (`lush_locale`)
- Browser language detection with English fallback

## Critical Implementation Paths

### Game Loop
1. `useEffect` shuffles products and selects 5 → sets playlist
2. Second `useEffect` loads current round product, resets state, generates 4 options
3. `handleGuess` checks answer, updates score/count, triggers confetti or shake
4. `handleNextRound` increments index or calls `onGameFinished`

### Leaderboard Submission
1. User enters name → form validation
2. `fetch('/api/leaderboard', { method: 'POST' })`
3. On success → show saved message → auto-navigate to leaderboard after 1s
4. On error → display error message, allow retry

### Offline Fallback
- LeaderboardScreen catches fetch errors
- Displays mock data (5 hardcoded entries) with offline warning banner
- UI remains fully functional without backend

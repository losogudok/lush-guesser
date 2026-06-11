# Active Context: Lush Scent Guesser

## Current Work Focus
Initializing the Memory Bank for the project. This is the first documentation pass to establish a baseline for all future development work.

## Recent Changes
- **Memory Bank Creation**: Establishing project documentation (`projectbrief.md`, `productContext.md`, `systemPatterns.md`, `techContext.md`, `activeContext.md`, `progress.md`)

## Next Steps
1. Review memory bank files for accuracy and completeness
2. Continue with any pending feature development or bug fixes as requested by the user

## Active Decisions & Considerations
- **Documentation Strategy**: Memory Bank lives in `memory-bank/` directory at project root; all files are Markdown
- **Update Triggers**: Memory Bank should be updated after significant changes, new pattern discoveries, or when explicitly requested with "update memory bank"

## Important Patterns & Preferences
- **Code Style**: Functional React components with hooks; explicit TypeScript types on props
- **Naming**: `PascalCase` for components, `camelCase` for functions/variables, `kebab-case` for files
- **Styling**: Tailwind utility classes preferred; custom CSS only for animations
- **Error Handling**: Frontend uses try/catch with user-friendly error messages; backend uses NestJS exception filters (`BadRequestException`)
- **i18n**: All user-facing strings must exist in both EN and RU translation objects

## Learnings & Insights
- The game uses a simple but effective scoring mechanic: 100 → 75 → 50 → 25 points based on revealed ingredient count
- Confetti and shake animations provide strong positive/negative feedback loops
- Offline fallback with mock data ensures the leaderboard screen never breaks
- Docker multi-stage builds keep production images small (Node build → Caddy/Node runtime)

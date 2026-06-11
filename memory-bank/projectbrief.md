# Project Brief: Lush Scent Guesser

## Overview
An interactive web game where players guess Lush cosmetic products based on gradually revealed ingredient cards. Players earn more points for guessing with fewer revealed ingredients. The game features a global leaderboard, bilingual support (English/Russian), and a bold, minimal aesthetic inspired by Lush's brand identity.

## Core Requirements

### Functional Requirements
1. **Welcome Screen**: Branded landing page with navigation (Play / Leaderboard), language toggle (EN/RU), and start game CTA
2. **Game Screen**: 5-round quiz where players guess products from revealed ingredients
   - Each round reveals 1 of 4 ingredients initially
   - Players can reveal additional ingredients at a cost of 25 points each
   - Points per round: 100 (1 ingredient), 75 (2), 50 (3), 25 (4)
   - 4 multiple-choice options per round (1 correct + 3 random distractors)
   - Confetti animation on correct guesses
   - Shake animation on incorrect guesses
3. **Game Over Screen**: Score summary with tiered titles (Soap Novice / Bath Bomb Enthusiast / Master Perfumer), stats display, name input for leaderboard submission, and navigation options
4. **Leaderboard Screen**: Global high scores table with rank, name, score, and date; supports offline fallback with mock data
5. **Bilingual Support**: Full English and Russian localization with browser detection and localStorage persistence

### Non-Functional Requirements
- Bold, high-contrast black-and-white design with neon accent colors
- Responsive layout (mobile-first, desktop-optimized)
- Fast load times, smooth animations
- Dockerized deployment (frontend + backend + SQLite)
- CORS-enabled backend for development

## Scope
- **In Scope**: Game logic, leaderboard API, i18n, Docker deployment, responsive UI
- **Out of Scope**: User authentication, persistent user profiles, real-time multiplayer, admin dashboard

## Success Criteria
- Players can complete a full 5-round game
- Scores submit successfully to the leaderboard
- Leaderboard displays top scores sorted by score (descending)
- UI is fully functional in both English and Russian
- Application runs via Docker Compose with one command

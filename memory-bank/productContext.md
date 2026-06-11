# Product Context: Lush Scent Guesser

## Why This Project Exists
This is a fan-made interactive quiz game celebrating Lush's iconic product scents. It tests players' knowledge of Lush's signature blends by challenging them to identify products from their ingredient lists — a fun, educational experience for Lush enthusiasts.

## Problem It Solves
- **Engagement**: Creates an interactive, shareable experience for Lush fans
- **Education**: Teaches players about the ingredients that make up Lush's signature scents
- **Community**: Global leaderboard fosters friendly competition

## How It Works

### User Flow
1. **Landing**: User arrives at the welcome screen, sees the brand title and tagline
2. **Navigation**: Can switch between Play and Leaderboard tabs; can toggle EN/RU language
3. **Game Start**: Clicking "Start Game" begins a 5-round session
4. **Gameplay**: 
   - Each round shows 1 revealed ingredient card out of 4
   - Player sees 4 multiple-choice product options
   - Guessing immediately locks in the current point value
   - Revealing more ingredients reduces the round's point value by 25
   - Wrong guesses earn 0 points for the round
5. **Results**: After 5 rounds, player sees final score, correct answer count, and a performance tier
6. **Leaderboard**: Player can submit their name to the global leaderboard, then view rankings

### Game Mechanics
- **Scoring**: Max 500 points (100 × 5 rounds). Revealing ingredients costs 25 points per reveal.
- **Rounds**: Exactly 5 rounds per game, randomly selected from 6 products without repetition
- **Tiers**:
  - 400+ points: "Master Perfumer" / "Мастер-парфюмер"
  - 200-399: "Bath Bomb Enthusiast" / "Любитель бомбочек"
  - 0-199: "Soap Novice" / "Новичок мыловарения"

## User Experience Goals
- **Immediate engagement**: Bold typography, high contrast, no clutter
- **Satisfying feedback**: Confetti on wins, shake on losses, smooth transitions
- **Accessibility**: Clear visual hierarchy, readable fonts (Inter, Cabinet Grotesk, Georgia)
- **Cultural inclusivity**: Full Russian localization with proper pluralization
- **Offline resilience**: Leaderboard falls back to mock data if backend is unreachable

## Target Audience
Lush fans, fragrance enthusiasts, casual gamers who enjoy quiz-style games

## Brand Alignment
- Visual style mirrors Lush's bold, minimal, black-and-white packaging aesthetic
- Neon green/cyan/yellow accents echo Lush's playful, vibrant in-store experience
- Ingredient imagery uses grayscale botanical illustrations

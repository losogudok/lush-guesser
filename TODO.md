# TODO

## Launch Blockers

- [x] Remove visible profile icons from launch UI.
- [x] Add a Help / How to Play modal for visible help buttons.
- [x] Replace footer `#` links with simple in-app Terms, Privacy, and Support content.
- [x] Clearly label leaderboard fallback data as sample data.

## Launch Polish

- [x] Keep ingredient-card reveal transitions stable with fixed card dimensions.
- [ ] Run a manual mobile QA pass for welcome, game, game over, leaderboard, and info modals.

## Content Expansion

- [x] Expand product catalog from 6 to 12 products.
- [x] Add deliberate ingredient image coverage for all launch ingredients.
- [x] Add catalog validation so product quality regressions fail CI.

## Production Hardening

- [x] Replace production TypeORM `synchronize: true` with explicit migration execution.
- [x] Add backend validation coverage for leaderboard API.
- [ ] Review npm audit output and decide which runtime-reachable dependency risks need upgrades.

## Testing

- [x] Add one Playwright browser smoke flow for the main game path.
- [ ] Run a final manual QA pass in English and Russian with backend online and unavailable.

## Documentation

- [x] Add root context glossary.
- [x] Update memory-bank progress, active context, tech context, and system patterns.

## Post-Launch

- [ ] Add sound effects or music.
- [ ] Add richer score sharing.
- [ ] Add admin tooling for removing inappropriate leaderboard names.
- [ ] Consider server-side rate limiting for leaderboard submission.
- [ ] Consider real accounts only if the product direction changes.

# Coding Standards

## Scope

- Keep the app a no-auth fan quiz. Do not introduce accounts, profiles, or login flows unless explicitly requested.
- Use the product language in `CONTEXT.md`: Player, Game Session, Round, Ingredient Clue, Product, and Leaderboard Entry.
- Do not put implementation details in `CONTEXT.md`.

## Frontend

- Use functional React components with hooks and explicit prop types.
- Keep user-facing strings in `frontend/src/i18n.ts` with both EN and RU translations.
- Prefer existing Tailwind utility patterns and shared components over one-off styling.
- Use lucide icons for controls when an icon exists.
- Avoid dead controls: every visible button or link must do something useful.

## Backend

- Keep leaderboard API behavior backward-compatible unless the issue explicitly changes it.
- Production schema changes must use explicit TypeORM migrations. Do not re-enable production `synchronize: true`.
- Validate API inputs at the controller boundary and cover invalid cases with e2e tests.

## Testing

- Run the relevant subset while iterating.
- Before committing, run the full project verification command from `docs/sandcastle.md`.
- If a command cannot run in the sandbox, document the exact blocker in the final response and commit message.

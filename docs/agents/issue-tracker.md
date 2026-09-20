# Issue tracker: GitHub

Issues and specs for this repository live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- Create: `gh issue create --title "..." --body "..."`
- Read: `gh issue view <number> --comments`
- List: `gh issue list --state open --json number,title,body,labels,comments`
- Comment: `gh issue comment <number> --body "..."`
- Add or remove labels: `gh issue edit <number> --add-label "..."` or `--remove-label "..."`
- Close: `gh issue close <number> --comment "..."`

Infer `losogudok/lush-guesser` from the Git remote.

## Pull requests as a triage surface

**PRs as a request surface: no.**

GitHub shares one number space across issues and pull requests. Resolve an ambiguous reference with `gh pr view <number>` and fall back to `gh issue view <number>`.

## Publishing

When a skill says to publish to the issue tracker, create a GitHub issue.

When a skill says to fetch a ticket, run `gh issue view <number> --comments`.

## Dependencies

Use GitHub's native issue dependencies where available. If unavailable, include a `Blocked by: #<number>` section in the issue body.

A ticket is ready when it is open, unassigned, and all blocking issues are closed.

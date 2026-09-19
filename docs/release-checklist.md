# Release Checklist

Before merging a branch that can deploy to production:

1. Run the local thermo-nuclear-code-quality review against the branch changes.
2. Do not merge if the review finds blocking structural, abstraction, or maintainability issues.
3. Push the branch and wait for GitHub Actions to pass linting, tests, builds, and the production Docker build.
4. Merge to `main` only after the local review is acceptable and CI is green.

Production deployment runs automatically from GitHub Actions after a successful push to `main`.

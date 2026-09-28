# Release Checklist

Before merging a feature branch into `dev`:

1. Run the local thermo-nuclear-code-quality review against the branch changes.
2. Do not merge if the review finds blocking structural, abstraction, or maintainability issues.
3. Push the branch and wait for GitHub Actions to pass linting, tests, builds, and the production Docker build.
4. Merge into `dev` only after the local review is acceptable and CI is green.
5. Verify the automatic development deployment at `https://lush-dev.lookmaimanengineer.cc`. The deploy job reports the deployed revision and the readiness checks that passed. If a release fails readiness or the public checks, the run log separates the original failure, the recovery attempt, and the final recovered or unrecovered state.

Promote a tested release through a pull request from `dev` to `main`. GitHub rejects other source branches for production promotion. After the promotion checks pass, merging into `main` deploys production automatically at `https://lush.lookmaimanengineer.cc`.

See [deployment.md](deployment.md) for environment configuration, activation checks, and rollback behavior.

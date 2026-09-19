# Keep LLM review local until CI integration

The thermo-nuclear code-quality review is a required local pre-merge gate for now, while GitHub Actions enforces deterministic checks only: linting, tests, builds, production Docker image build, and deployment from `main`. This keeps CI reliable without introducing an API-backed LLM reviewer or self-hosted runner yet, with the accepted tradeoff that branch protection cannot technically verify the local LLM review step.

# Contributing to FitFood

This guide describes how to set up the development environment, follow the team's Git workflow, and meet the Definition of Done before opening a pull request.

## Development environment

**Prerequisites:** Python 3.12, Docker (optional but recommended for full-stack runs).

```bash
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt -r requirements-dev.txt
```

Run the app locally (SQLite, mock LLM/OCR — no external keys needed):

```bash
uvicorn app.main:app --reload
```

Run with PostgreSQL via Docker Compose:

```bash
docker compose up --build -d
curl http://127.0.0.1:8000/health
```

## Branching and commit conventions

- `main` is the protected default branch. **Never push directly.**
- Create a branch per issue: `feature/issue-number-short-description` or `bugfix/issue-number-short-description`.
- Every commit message and PR title must reference the issue number in brackets: `[#86] Implement LLM meal generation prompt`.
- Keep commits focused — one logical change per commit.

## Pull request checklist

Before opening a PR:

1. All tests pass locally: `pytest`
2. Critical coverage threshold is met: `python scripts/check_critical_coverage.py`
3. Static security scan is clean: `bandit -r app -ll`
4. Dependency audit passes: `pip-audit -r requirements.txt`
5. The PR is linked to its issue (reference in title or body).
6. At least one team member is assigned as reviewer.
7. Acceptance criteria from the issue are verified and noted in the PR description.

The PR cannot be merged until CI passes and at least one reviewer approves.

## Running tests

```bash
pytest                                        # all tests
pytest -m qrt                                 # Quality Requirement Tests only
pytest --cov=app --cov-report=term-missing    # with coverage report
```

Tests use a temporary SQLite database and `LLM_PROVIDER=mock`. PostgreSQL and real API keys are not required.

## Environment variables

All configuration is via environment variables. Defaults are set for local development — no `.env` file is required to run or test the app.

| Variable | Default | Description |
| --- | --- | --- |
| `SECRET_KEY` | random | JWT signing secret |
| `DATABASE_URL` | SQLite file | PostgreSQL URL for production |
| `LLM_PROVIDER` | `mock` | `mock` or `openai` |
| `OPENAI_API_KEY` | — | Required only when `LLM_PROVIDER=openai` |

See `docker-compose.yml` and `app/config.py` for the full list.

## Definition of Done

A PBI is done when:

- Code is implemented and runs without critical errors.
- All CI checks pass (pytest, coverage threshold, Bandit, pip-audit).
- Code is reviewed and approved by at least one other team member.
- Acceptance criteria from the issue are verified.

Full DoD: [docs/definition-of-done.md](docs/definition-of-done.md).

## Documentation

Maintained docs live in `docs/` and are published to <https://xqzme-otec.github.io/fitFood/>.  
Update the relevant `docs/` page when your change affects architecture, process, quality requirements, or user-facing behaviour.

## Questions

Open a GitHub issue or contact the Scrum Master via the team channel.

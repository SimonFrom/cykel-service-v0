# Plan: <Feature name>

- **Spec:** `docs/features/<slug>/spec.md` (contract v<N>)
- **Branch:** `feature/<slug>` from `<base>`

## File ownership
| Owner | May modify |
|---|---|
| backend-developer | e.g. `server/`, `migrations/`, `shared/types/api.ts` |
| frontend-developer | e.g. `web/src/` |
| qa-engineer | e.g. `tests/`, `**/*.test.*`, fixtures |

## Tasks
| ID | Tag | Task | Covers | Owner |
|---|---|---|---|---|
| T-1 | [shared] | Define API types from contract | AC-1..n | backend |
| T-2 | [backend] | … | AC-1, SR-2 | backend |
| T-3 | [frontend] | … | AC-1 | frontend |
| T-4 | [tests] | Acceptance tests for all AC/SR | all | qa |

## Verification commands
```bash
# lint:
# typecheck:
# test:
# build:
```

## Risks / notes
-

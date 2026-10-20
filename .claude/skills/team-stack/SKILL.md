---
name: team-stack
description: Inspects an existing codebase and fills out docs/STACK.md, the stack and conventions file every dev-team agent reads first. It detects languages, frameworks, layout, commands, conventions and constraints from real evidence, verifies the commands, and asks the user only about gaps. Use when onboarding the dev team to a project, when docs/STACK.md is missing or stale, or when the user types /team-stack [path].
argument-hint: "[project path] (optional; defaults to the current directory) [--update]"
---

# Fill out docs/STACK.md from the codebase

Target project: $ARGUMENTS. If that's empty, use the current working directory. With `--update`, refresh an existing `docs/STACK.md` instead of creating one.

The template is `STACK.template.md` in this skill's folder. That's `.claude/skills/team-stack/STACK.template.md`, or `~/.claude/skills/team-stack/STACK.template.md` if installed globally. The output is `<project>/docs/STACK.md`.

**Core rule: every value comes from evidence in the repo.** Never guess a framework, command or convention from what's "typical". If you can't find evidence, write `TODO(ask)` and collect it as a question.

## Step 1: Check what already exists
- If `docs/STACK.md` exists and `--update` wasn't given, show the user its age (`git log -1 --format=%cr -- docs/STACK.md`) and ask whether to update it or stop.
- Read `CLAUDE.md`, `README*`, `CONTRIBUTING*` and `docs/` for stated conventions. Stated conventions win over inferred ones, unless the code clearly contradicts them; flag any contradiction.

## Step 2: Detect, in parallel where possible
For a large repo or monorepo, dispatch up to 3 `Explore` agents in a single message. Split them by area, e.g. frontend, backend, and tooling/CI. Ask each one to return findings **with the file paths as evidence**. For a small repo, just do it inline.

Look at:

| Section | Where to look |
|---|---|
| **Stack** | Manifests and their dependency versions: `package.json`, `pnpm-workspace.yaml`, `pyproject.toml`, `requirements*.txt`, `go.mod`, `Cargo.toml`, `Gemfile`, `composer.json`, `*.csproj`, `pom.xml`/`build.gradle`. Framework config files, e.g. `vite.config.*`, `next.config.*`, `angular.json`, `manage.py`, `nest-cli.json`. |
| **Database** | ORM config and schema: `prisma/schema.prisma`, `alembic/`, `migrations/`, `drizzle.config.*`, `ormconfig`, `docker-compose*.yml` services, `.env.example` (`DATABASE_URL`). |
| **Auth** | Auth libraries in the dependencies, and middleware names: `passport`, `next-auth`/`auth.js`, `clerk`, `django.contrib.auth`, `fastapi-users`, JWT libraries, OIDC config. |
| **Hosting/CI** | `Dockerfile`, `fly.toml`, `vercel.json`, `netlify.toml`, `render.yaml`, `k8s/`, `terraform/`, `.github/workflows/`, `.gitlab-ci.yml`. |
| **Layout** | The top-level tree (2–3 levels deep, excluding `node_modules`, `.venv`, `dist`, build output). Workspace definitions. Decide where frontend, backend, shared types and tests live. |
| **Commands** | `package.json` scripts, `Makefile`, `justfile`, `Taskfile.yml`, `tox.ini`/`noxfile.py`, `pyproject` scripts. **The CI workflow steps are the most reliable source**, because they're what actually runs. Detect the package manager from the lockfile (`pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`, `package-lock.json`, `uv.lock`, `poetry.lock`). |
| **Conventions** | Read the code itself, 2–3 representative files per area: error response shape (look at an existing error handler), API style and versioning (route definitions), naming (file and identifier casing), state management (store libraries and patterns), component library (UI dependencies, a `components/ui/` folder), test style (an existing test file: framework, fixtures, mocking approach), and commit format (`git log --oneline -20`, plus commitlint config). |
| **Constraints** | `browserslist`, `engines`, `.nvmrc`/`.python-version`/`.tool-versions`. Generated folders (look for "generated"/"do not edit" headers, `codegen` config). Lint and formatter config such as `eslint`, `biome`, `ruff`, `prettier`. |

## Step 3: Verify the commands
For each command you found:
- **Safe to run without asking** (fast and read-only): `lint`, `typecheck`, and a `--help`/`--version` check for the tooling. Run them with a timeout and record pass, fail or not-runnable.
- **Ask first:** `install`, `test`, `build`, `test-e2e`, `dev`, and `audit`. These can be slow, need services or a network, or write files. Offer to run them together in one AskUserQuestion; don't ask about them one at a time.
- **Never** run anything that deploys, migrates a real database, or pushes.

Mark each command in the file as `✓ verified`, `✗ fails: <one-line reason>` or `unverified`.

## Step 4: Ask about the gaps
Collect every `TODO(ask)`, every contradiction, and every agent-ownership choice that's genuinely ambiguous. Ask them in a **single AskUserQuestion round** of at most 4 questions, and offer your best evidence-based guess as the first option. Typical gaps:
- "Things agents must never do"
- the accessibility target (default: WCAG 2.2 AA)
- browser support, if there's no `browserslist`
- hosting, if there's no deploy config

Anything still unanswered after that stays as `TODO` in the file.

## Step 5: Write docs/STACK.md
Fill in the template.
- **Keep it factual and short.** Each line is a value, not prose.
- **In the Layout table**, give each path's owner agent: `frontend-developer`, `backend-developer` or `qa-engineer`. Give shared types/contracts to exactly one owner, normally `backend-developer`. Files the agents must not edit get the owner `none (do not edit)`.
- **For a monorepo with several apps**, add a row per app and give per-app commands, e.g. `pnpm --filter web test`.
- **Add an `## Evidence` section at the bottom** listing the key files each section was derived from. Later reviewers and `--update` runs use it.
- **On `--update`, preserve human edits.** Only change values whose evidence changed, and summarise the diff for the user.

## Step 6: Report
Tell the user:
- the path written
- a 5-line stack summary
- the verification results for each command
- the remaining TODOs
- any contradictions between the docs and the code

If `CLAUDE.md` exists but doesn't mention `docs/STACK.md`, offer to add a one-line pointer to it. Don't edit `CLAUDE.md` without asking.

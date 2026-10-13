---
name: create-pr
description: Create a GitHub pull request for the current branch following cykel-service-v0 conventions. Use only when the user explicitly asks to create a PR or runs /create-pr.
disable-model-invocation: false
argument-hint: "[--draft] [extra context for the description]"
---

# Create a cykel-service-v0 pull request

Running `/create-pr` authorises pushing the **current branch** and opening **one** PR for it. It does not authorise commits, merges, rebases or force-pushes — ask for those separately.

## 1. Check the branch

1. `git fetch origin`
2. If the current branch is `main`, stop and ask the user which branch to create.
3. If there are uncommitted changes, list them and ask whether they belong in the PR. Do not commit without explicit permission.
4. If the branch is behind its remote, stop and ask before pulling.
5. If the branch is behind `origin/main`, tell the user and ask whether to merge/rebase first. Do not do it unasked.
6. If a PR already exists for the branch (`gh pr view`), show its URL and stop.

## 2. Type check

Run from the repo root:

```bash
npx tsc --noEmit
```

If it fails, show the errors and stop. Do not open a PR on a failing type check.

## 3. Review the changes

Read `git log origin/main..HEAD` and `git diff origin/main...HEAD`. Check against CLAUDE.md and flag (don't silently fix) any of:

- Supabase called outside `crud/` (e.g. `supabase.from(...)` in a screen, component or store).
- `snake_case` DB columns leaking out of `crud/` instead of being mapped to the types in `types/`.
- Domain types redeclared inline instead of imported from `types/`.
- Feature-specific edits to generated files in `components/ui/stock components/`.
- A screen changed without its platform variant (`.web.tsx`, `.ios.tsx`), or vice versa — mention it so the user can decide.
- New packages, Supabase schema changes or auth/RLS changes — these must be called out in the description.
- Secrets or keys in tracked files (including `.env`).

## 4. Draft title and description

**Title:** `[Area] Short imperative description` — Area is one of `Screens`, `Components`, `Data` (crud/types), `State` (stores), `Config`, `Docs`, or `Multiple`. Max ~70 characters.

**Description:**

```markdown
## Summary
<1–3 bullets: what changed and why>

## Areas touched
<e.g. Screens (customers/[id]), Data (crud/repairs.ts)>

## How it was tested
<type check result; manual checks and on which platform (web/iOS/Android)>

## Needs attention
<packages added, schema changes, auth/RLS changes, review findings from step 3 — or "None">

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

Write in English. Keep it short and concrete.

## 5. Confirm, push, create

1. Show the user the title and description and wait for approval or edits.
2. Push: `git push -u origin HEAD` (never `--force`).
3. Create: `gh pr create --base main --title "<title>" --body "<body>"` — add `--draft` if the user passed `--draft`.
4. Reply with the PR URL.

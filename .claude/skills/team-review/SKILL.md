---
name: team-review
description: Run the dev team's multi-agent review (code-reviewer, security-expert, qa-engineer, and ui-ux-advisor if UI changed) against the current branch or a given feature slug, without the build loop. Use when the user asks the team to review existing changes, or types /team-review [slug].
argument-hint: "[slug] (optional; defaults to reviewing current branch vs main)"
---

Run a review of: $ARGUMENTS. If that's empty, review the current branch against its base.

1. If a slug is given and `docs/features/<slug>/` exists, use its `spec.md`, `security-design.md` and `ux.md` as review context, and continue round numbering from `status.md`.
2. If there is no slug, create `docs/reviews/<branch-name>-<date>/` as the output folder. Reviewers judge against the code and the commit messages alone, since there's no spec.
3. Determine the diff with `git merge-base HEAD main`, falling back to `master`. Check whether any UI files changed, which decides whether ui-ux-advisor runs.
4. Follow **Phase 4 (Review)** of the `team-lead` skill: dispatch the reviewers in parallel in a single message, then aggregate their findings into `fixes.md`.
5. Present the de-duplicated findings to the user, sorted by severity. **Do not fix anything** unless the user asks. If they do, follow Phase 5 of `team-lead`.

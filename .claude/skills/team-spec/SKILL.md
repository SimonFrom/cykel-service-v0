---
name: team-spec
description: Run only the specification phase of the dev team. The spec-writer drafts the spec, then the security-expert and ui-ux-advisor review it in design mode. Use when the user wants a spec, PRD or threat model for a feature without building it yet, or types /team-spec <feature request>.
argument-hint: <feature request>
---

Run **Phase 0 (Intake)** and **Phase 1 (Specification)** from the `team-lead` skill (`.claude/skills/team-lead/SKILL.md`) for: $ARGUMENTS

Stop at Gate 1. Present the spec to the user and resolve the open questions, then set `phase: gate1` (or `plan` if approved) in `status.md`. The user can continue later with `/team-lead resume <slug>`.

Skip the branch creation and the clean-tree checks, since no code is changed in this phase.

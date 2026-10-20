# Status: 19-repair-discounts

```yaml
slug: 19-repair-discounts
request: "Add feature to discount items — repair total cost should support a discount: per individual item, percentage of total price, or flat amount from total price. Also the total_price column isn't updated in the database."
issue: https://github.com/SimonFrom/cykel-service-v0/issues/19
base: main
branch: feature/19-repair-discounts
phase: fix     # intake | spec | gate1 | plan | build | review | fix | docs | gate2 | done | escalated
round: 1        # review round, max 3
has_ui: true
gate1_approved: true
gate2_approved: false
```

## Log
<!-- Append one line per phase transition: date — phase — outcome -->
- 2026-10-20 — intake — created from issue #19 (open, no linked PR); branch feature/19-repair-discounts from main
- 2026-10-20 — spec — spec.md written (15 AC, 8 OQ, schema change proposed); security + UX design reviews dispatched
- 2026-10-20 — gate1 — user approved: schema change (cols + constraints + backfill w/ backup, user runs SQL), columns already numeric, one repair-level discount (% or kr), add jest + jest-expo; other OQs default. Spec revision dispatched (security amendments SR-7/8/9/12/13/15 + UX B-1..B-4)
- 2026-10-20 — gate1 — out-of-scope findings surfaced to user: RLS likely open to anon; .env tracked in git (verify key is anon)
- 2026-10-20 — plan — plan.md written (T-1..T-10); user authorised local commits/merges on feature/19-repair-discounts (no push, no main). Shared tasks T-1..T-3 dispatched to backend
- 2026-10-20 — build — shared T-1..T-3 committed (bebdac2; tsc + npm test pass). Minor contract clarifications from backend accepted without version bump (validateDiscount message precedence, range checks on gross/subtotal/total, NaN/Infinity/overflow → 'Ugyldigt tal'). Docs committed (355a3d6). Parallel build dispatched: backend T-4/T-5, frontend T-6..T-9, qa T-10 (worktrees)
- 2026-10-20 — build — merged backend (d3435e9), frontend (1070877), qa (f3c01ad) → 8d8c6fa; tsc OK, npm test 78/78. Open note: store keeps caller totals after mutation (CLAUDE.md wants store updated with saved values). → review round 1
- 2026-10-20 — review r1 — 0 blockers, 8 majors (code 2, sec 1, qa 3, ux 2; de-duplicated). fixes.md written; contract v3 (crud returns saved Repair, RepairSaveError, roundMoney, tryCalculateRepairTotals, addRepairToStore). Fix round dispatched

# Security review: 19-repair-discounts, round 2

**VERDICT:** PASS
**Scope reviewed:** `git diff 8d8c6fa..HEAD` on `feature/19-repair-discounts` (HEAD fb9d26a): `crud/repairs.ts`, `lib/repairPricing.ts`, `lib/theme.ts`, `store/repairStore.ts`, `app/createRepairModal.tsx`, `components/ui/RepairLinesSection.tsx`, `components/ui/DiscountInput.tsx`, `docs/features/19-repair-discounts/migration.sql` (static only, it hasn't been run), `spec.md` (contract v3), `Test/Claude/*`. This is a verification round: round-1 findings plus regressions against SR-1..SR-15.
**Counts:** blocker: 0 · major: 0 · minor: 1

## Findings

### SEC-7 · minor · A retry after `RepairSaveError` can loop when the row is already gone, because a 0-row update isn't detected
- **Where:** `crud/repairs.ts:233-250` (`updateRepair`); `app/createRepairModal.tsx:121`
- **Problem:** `RepairSaveError` fires when the compensating delete *returns* an error. That doesn't prove the row survived. If the DELETE committed but the response was lost (the same flaky-network case), the modal sets `id = repairId` and the retry runs `updateRepair` on an id that no longer exists. PostgREST reports a 0-row `UPDATE` as success. The item delete also matches 0 rows. The item insert then fails on the `repair_id` FK, and the user sees the generic error. Every further retry fails the same way until they close the modal. There's no duplicate, data exposure or wrong-row write, so SR-13 still holds. The cost is that the user is stuck in a loop. The same blind spot means an `UPDATE` filtered out by a future RLS policy would look like it succeeded.
- **Fix:** In `updateRepair`, chain `.select('id')` after `.eq('id', id)` and throw when `data` is empty (e.g. `throw new Error('Repair not found')`). Optionally, the modal can catch that error and reset `id` to 0 so the next retry creates the repair again. Add a crud test where the update returns `data: []`.
- **Refs:** SR-12, SR-13, T-6

## Previously reported (round ≥ 2)
| ID | Status: fixed / still open / accepted-dispute |
|---|---|
| SEC-1 (major, via F-4) | **fixed**. `crud/repairs.ts:217-220` now checks `deleteError` and throws `RepairSaveError(repairId, itemsError)`. `app/createRepairModal.tsx:121` calls `setValue('id', error.repairId)`, so the retry goes through `updateRepair`, which rewrites all lines. The submit label follows `watch('id')`. A retry doesn't clobber `bike_id`/`customer_id`: the form has no such fields, so they're `undefined` and dropped by JSON serialisation, and the row keeps its original ids. Tests: `Test/Claude/repairsCrud.test.ts:191, 207`. Residual edge case is SEC-7 (minor). |
| SEC-2 (minor) | **fixed**. The preflight selects `is_nullable` and null counts (`migration.sql:10, 24-33`). SR-7d–g are null-rejecting (`migration.sql:114-123`). |
| SEC-3 (minor, via F-1/F-2) | **fixed, one conditional part pending.** Price is rounded with `roundMoney` before calculating and writing (`crud/repairs.ts:114-123`), so the line total and the stored price agree. Antal/Pris use a strict regex buffer (`RepairLinesSection.tsx:33-38`) and `rules.validate` with Danish messages, so `Number(t) \|\| 0` is gone. Still open: whether `repair_items.quantity` is an integer column. The preflight now reports its `data_type` (`migration.sql:14`). If it is an integer, `validateQuantity` (`RepairLinesSection.tsx:46`) must also reject non-integers, otherwise `1,5` hits a DB error after `updateRepair` has deleted the lines (SR-14). Check this when the preflight output lands in `status.md`. |
| SEC-4 (minor, via F-2) | **fixed**. `normalizeDiscount` rounds before the zero check (`crud/repairs.ts:52-56`) and is used for both the written columns and the calculator input, so `0.004` becomes `null/0` and doesn't violate `*_discount_consistency_chk`. |
| SEC-5 (minor) | **fixed** (the approach chosen in fixes.md). The preflight is a clearly marked read-only block outside the transaction, with a "run this block alone first, paste into status.md" instruction (`migration.sql:4-37`). `begin;` now comes after it (`:41`). There's no evidence in `status.md` yet, which is expected because the migration hasn't run. |
| SEC-6 (minor) | **deferred to user** (fixes.md). The comment is unchanged at `migration.sql:63-65`. Raise it at Gate 2. |

## SR verification

| SR | Result | Evidence / change since round 1 |
|---|---|---|
| SR-1 | pass | `prepareRepair` overwrites `items[].total` with `totals.lines[i].net` and writes `total_price: totals.total`. Caller totals are never read (`crud/repairs.ts:114-123`). |
| SR-2 | pass | Explicit column literals are unchanged. `buildItemRows` (`:127-138`) uses only the 7 allowed columns. The `...item` spread only builds the in-memory result and never reaches a payload. |
| SR-3 | pass | `prepareRepair` (which throws) runs before the first request in both create and update. `tryCalculateRepairTotals` is only used for display. |
| SR-4 | pass | `roundMoney` = `fromOre(toOre(x))`, the same rounding as the calculator. SEC-4 is closed. |
| SR-5 | pass | `DiscountInput` is unchanged apart from the a11y role. The new `NUMBER_RE` for Antal/Pris is equally strict. |
| SR-6 | pass | The read mappers are unchanged. New tests are in `Test/Claude/repairsRead.test.ts`. |
| SR-7 | pass | Null-safe now (SEC-2 closed). |
| SR-8 | pass (static) | `begin`/`commit` wrap only the migration. The preflight is read-only. The type guard is kept (`:44-59`). |
| SR-9 | pass (static) | Unchanged. SEC-6 is deferred. |
| SR-10 | not verifiable | The grep (`create policy\|alter policy\|grant\|revoke\|disable row level\|security definer`) only matches the comment on line 2. There's no preflight / `pg_policies` output in `status.md` until the user runs it. This is a Gate 2 check. |
| SR-11 | pass | Still the generic Danish alert plus `console.error(error)` only. The `RepairSaveError` message, "Repair saved without items", isn't shown to the user. No new `console.log` in the diff. |
| SR-12 | pass | Form state is kept on failure. Focus returns to the submit button. |
| SR-13 | pass | Fixed via F-4. Residual loop edge case is SEC-7 (minor, no duplicate). |
| SR-14 | pass (conditional) | Price and quantity are validated client-side. The integer-quantity question depends on the preflight (see SEC-3 row). |
| SR-15 | pass | Unchanged. |

## Notes

- `npx tsc --noEmit`: clean. `npm test`: 6 suites, 102/102 pass.
- No `package.json`, `package-lock.json` or `.env` changes in this range, so no new dependency surface. I didn't rerun `npm audit`; the round-1 result still applies.
- Display path: `displayTotals` falls back through `tryCalculateRepairTotals` and never throws or renders NaN. Display-only, so it doesn't affect what gets written.
- `addRepairToStore` / `updateRepairInStore` store the crud return value (calculator totals, normalised discounts). After a `RepairSaveError` retry, `updateRepairInStore` maps over a list that doesn't contain the new repair, so it won't appear until the refetch on focus. That's a functional point for code/QA, not a security one.
- The `console.log` calls in `crud/customers.ts:84`, `crud/bikes.ts:26`, `createBikeForm.tsx` and `createBikeModal.tsx` are pre-existing and outside this diff (backlog).
- No tools were installed.

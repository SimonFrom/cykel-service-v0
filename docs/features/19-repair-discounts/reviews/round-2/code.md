# Code review: 19-repair-discounts, round 2

**VERDICT:** APPROVED_WITH_COMMENTS
**Scope reviewed:** Round-1 findings against fixes.md, plus `git diff 8d8c6fa..HEAD -- . ':!docs'`. `npx tsc --noEmit` is clean and `npx jest` passes (102 tests).
**Counts:** blocker: 0 · major: 0 · minor: 4

## Round-1 verification
| ID | Status | Note |
|---|---|---|
| CR-1 (F-1) | Fixed | `NumberField` plus strict `parseNumberText`. `validateQuantity`/`validatePrice` are wired as `rules.validate` with Danish messages. Discounts revalidate when price, quantity, type or value change (`baseKey`). |
| CR-2 (F-3) | Fixed | Crud returns the saved `Repair` built from calculator output. The modal calls `addRepairToStore`/`updateRepairInStore`. The unused code is gone. See CR-9 for two edge cases. |
| CR-3 | Partially | `tryCalculateRepairTotals` and `roundMoney` are in `lib`, and no øre rounding remains in the component. `displayTotals` still has four fallback attempts (see CR-10). |
| CR-4 | Fixed | `prepareRepair` computes totals once. `buildItemRows` no longer calls the calculator. |
| CR-5 | Fixed | `ERROR_TEXT_COLOR` now lives in `lib/theme.ts`. `refProp` stays exported from `DiscountInput`. That is acceptable, as fixes.md allowed. |
| CR-7 | Fixed | Unused `checkedComplete`/`checkedPayment`, `styles.container` and the unused store selector are removed. |
| CR-8 | Fixed | Decimals can be typed through the raw-text buffer. |
| CR-6 | Unchanged | Deferred by design (iOS modal differs from web). |
| F-2 | Fixed | `prepareRepair` rounds prices. `normalizeDiscount` rounds before the zero check. |
| F-4 | Fixed | `RepairSaveError` is thrown when the compensating delete fails. The modal does `setValue('id', repairId)`, and the button label follows `watch('id')`. |
| F-5, F-6, F-7 | Fixed (code read only) | Row layout, live revalidation and error colour on the Alert are in place. The layout and contrast still need manual checks. |
| F-8 | Fixed | New tests: `parseDiscountText`, `repairsRead`, `repairPricingV3` and extended `repairsCrud`. |

## New findings

### CR-9 · minor · Stored repair has placeholder item ids; retry-via-update is not added to the list
- **Where:** `crud/repairs.ts:228` (`createRepair` return) and `:266` (`updateRepair` return), `store/repairStore.ts:36-40`, `app/createRepairModal.tsx:113-116`
- **Problem:**
  - The returned `items` keep the form ids (`Date.now()` for new lines). Neither function reads the inserted rows back, so the store holds ids that don't exist in the DB until the next refetch. Anything keyed on `item.id` in the store (React keys are fine, but not edits or deletes) would be wrong.
  - After a `RepairSaveError`, the retry goes through `updateRepair` and then `updateRepairInStore`. That action only maps over existing entries, so the new repair never appears in `repairs`. It is fixed only by the refetch on focus.
- **Fix:**
  - Add `.select('id')` to the item insert and map the returned ids, or document that the store ids are provisional.
  - In `updateRepairInStore`, append the repair if no id matches.

### CR-10 · minor · `displayTotals` is more complex than needed, and its fallback is coarse
- **Where:** `components/ui/RepairLinesSection.tsx:50-74`
- **Problem:**
  - Four chained `tryCalculateRepairTotals` calls plus a hard-coded zero object. The fallback knowledge ("which part is invalid") belongs in `lib/repairPricing.ts`.
  - It is also lossy. If one line has an invalid discount (for example 150%), attempt 2 drops the discounts of all lines. Footer and line totals then flicker to undiscounted values while the user types a half-valid discount on one line.
  - `subtotalOf(form.items)` (repair-discount validation base) uses the same lossy path, so that validation base can differ from what the calculator would produce.
- **Fix:** Add `calculateRepairTotalsLenient(items, discount)` in `lib`. Per line, it treats an invalid price/quantity as 0 and an invalid discount as null. It then applies the repair discount, or null if that one is invalid. Delete `usable` and the chain, and keep `lineBase`/`subtotalOf` as thin wrappers over it. This is not blocking. The behaviour is safe: it never throws and never shows NaN.

### CR-11 · minor · Number parsing duplicated with `parseDiscountText`
- **Where:** `components/ui/RepairLinesSection.tsx:33-48,98-117` vs `components/ui/DiscountInput.tsx:11-27,76-90`
- **Problem:** This is the second occurrence of the regex and the raw-text/sync-effect pattern. Under the repo's "extract on the third occurrence" rule it is acceptable now. The two copies already differ (`NUMBER_RE` allows a negative sign, `DECIMAL_RE` plus `NEGATIVE_RE` do the same in two regexes). The next change to number entry has to touch both.
- **Fix:** Optional. Move `NumberField` and `parseNumberText` into `components/ui/NumberField.tsx`, and share the regex pieces. Do it when a third use appears.

### CR-12 · minor · Ref passed via `{...({ ref: submitRef } as object)}`
- **Where:** `app/createRepairModal.tsx:142`, `components/ui/RepairLinesSection.tsx:156,222`
- **Problem:** Casting to `object` defeats typing to get around the stock `Button`'s ref type. It is used twice now, next to the existing `refProp` helper in `DiscountInput`.
- **Fix:** Reuse `refProp(submitRef)` / `refProp(addRef)` so there is one workaround, or type the ref on the wrapper.

## Notes
- Contract v3 matches the implementation: `roundMoney`, `tryCalculateRepairTotals`, `createRepair`/`updateRepair` returning `Repair`, and `RepairSaveError`.
- `NumberField` handles NaN correctly. `Object.is(NaN, NaN)` is true, so the sync effect doesn't clobber partial text.
- The conclusion on `displayTotals`: it is safe but too clever, and the tolerant logic should move to `lib/repairPricing.ts` (CR-10).

# Code review: 19-repair-discounts, round 1

**VERDICT:** CHANGES_REQUESTED
**Scope reviewed:** `git diff main...feature/19-repair-discounts` (code, Test/Claude, migration.sql). Ran `npx tsc --noEmit` (clean) and `npx jest` (78 pass).
**Counts:** blocker: 0 · major: 2 · minor: 5

## Findings

### CR-1 · major · Empty or negative quantity/price passes the form, then save fails with the generic error
- **Where:** `components/ui/RepairLinesSection.tsx:222,240` (parsing), `app/createRepairModal.tsx:109-113` (catch)
- **Problem:** Quantity and price use `onChange(Number(t) || 0)`. Clearing the quantity field gives `quantity = 0`. Typing `-5` as the price gives `-5`. The form has no rule for either. On "Opdater"/"Opret", `calculateRepairTotals` throws (`quantity <= 0`, negative price). The user sees "Reparationen kunne ikke gemmes" with no hint about which field is wrong. Clearing a field while editing is a realistic action. The spec (§3 bounds, SR-14) says client validation must reject everything the DB constraints reject, and the constraints include `quantity > 0` and `price >= 0`. The out-of-scope note only covers the parsing style, not the missing validation.
- **Fix:** Add `rules.validate` on `items.${index}.quantity` (`> 0`) and `items.${index}.price` (`>= 0`) with Danish messages, shown under the field. Alternatively map a calculator throw to a specific message. Keep the `Number(t) || 0` parsing.
- **Refs:** SR-14, AC-6, AC-14

### CR-2 · major · Store is never updated after a save, and the modal keeps an unused store action
- **Where:** `app/createRepairModal.tsx:45,95-119`, `store/repairStore.ts:33`
- **Problem:** CLAUDE.md says to update the store after a mutation so the UI reflects it without a refetch. `updateRepairInStore` is declared on line 45 and never called, so it is dead code. After a save the store has neither the stored form values nor the crud-computed totals. `selectedRepair` also stays set to the pre-edit object. The UI is only correct because the bike screen and front page refetch on focus (spec §5.4, AC-10). Until that fetch returns, a list shown from the store has the old total, and a new repair is missing. The stale-form-values risk is avoided only because nothing is stored. `createRepair` returns just the id and `updateRepair` returns void, so the crud-computed totals never reach the caller.
- **Fix:** Pick one and be consistent.
  - (a) Make the refetch-on-focus explicit. Call `useRepairStore.getState().fetchRepairs()` after a successful save, and remove the unused `updateRepairInStore` line. This is the smallest change and fits spec §5.4.
  - (b) Have `createRepair`/`updateRepair` return the saved `Repair` built from the calculator output. The modal can then call `updateRepairInStore`. If you do this, never store the form's `totalPrice` or item totals.
- **Refs:** CLAUDE.md "Stores", AC-10

### CR-3 · minor · `safeTotals`/`withRepair` are convoluted and re-implement rounding
- **Where:** `components/ui/RepairLinesSection.tsx:40-74`
- **Problem:** The fallback spreads `calculateRepairTotals([], null)` and then overrides it. `withRepair` builds a fake line with `price: subtotal` to reuse the repair discount maths. `Math.round(... * 100) / 100` duplicates øre logic outside `lib/repairPricing.ts`, which the spec says is the only place for it. This is hard to reason about.
- **Fix:** Add a non-throwing `calculateRepairTotalsSafe` (or a `lenient` option) in `lib/repairPricing.ts` that treats invalid lines as 0 and invalid discounts as null. Delete the fallback chain, `withRepair` and `subtotalOf` from the component.
- **Refs:** Spec §3 "Nothing else may calculate totals"

### CR-4 · minor · `createRepair`/`updateRepair` run the calculator two or three times
- **Where:** `crud/repairs.ts:143-145,172,188-190`
- **Problem:** `calculateRepairTotals` runs once directly and again inside `buildItemRows`. `createRepair` also calls `buildItemRows(0, repair)` only for its throw side effect, then calls it again with the real id. This is correct but confusing.
- **Fix:** Add `const totals = calculateRepairTotals(...)` once and pass `totals.lines` into `buildItemRows(repairId, items, lines)`. In `createRepair`, build the rows before the repair insert with a placeholder, or map the `repair_id` afterwards (`rows.map(r => ({ ...r, repair_id }))`).

### CR-5 · minor · The modal imports the error colour from `DiscountInput`
- **Where:** `app/createRepairModal.tsx:18`, `components/ui/RepairLinesSection.tsx:10`
- **Problem:** A shared design constant lives inside a feature component, so `DiscountInput` and the screen are coupled to each other. `refProp` has the same problem. `RepairLinesSection` imports a helper from `DiscountInput` just to work around the stock `Input` typing.
- **Fix:** Move `ERROR_TEXT_COLOR` to `lib/theme` (or the existing theme file). Keep `refProp` private to `DiscountInput`, or use a single typed wrapper.

### CR-6 · minor · iOS modal: behaviour differs, silent failure
- **Where:** `app/createRepairModal.ios.tsx:75-82` (not changed, as intended)
- **Problem:**
  - It compiles. `tsc` is clean. `defaultValues.discount` is undefined, which crud and the footer treat as null.
  - Line discounts work through the shared component, but there is no repair-level discount field. The iOS modal only calls `createRepair` (no update path), so existing discounts can't be wiped there.
  - Calculator throws are caught with `console.error` only, and the modal stays open with no message.
- **Fix:** Keep out of scope as the spec says. Note it as a known difference; no code change needed.
- **Refs:** Spec §9 iOS note

### CR-7 · minor · Duplicate `useFocusEffect` and unused leftovers
- **Where:** `app/createRepairModal.tsx:45,91-92` (`updateRepairInStore`, `checkedComplete`, `checkedPayment` are unused); `styles.container` is unused
- **Problem:** Dead code that existed before and is partly touched by this PR. The `[bikeId].tsx` duplicate focus effect is explicitly out of scope.
- **Fix:** Remove the unused declarations in the modal while you are in the file.

### CR-8 · minor · Decimal price entry is still not possible
- **Where:** `components/ui/RepairLinesSection.tsx:240-241`
- **Problem:** Because `onChange(Number(t) || 0)` is re-rendered as `value.toString()`, typing `99.` immediately becomes `99`. The user can't type a price like `99.99` character by character, only by pasting. Discounts now make decimals matter more (e.g. E2). Spec calls this out of scope, so I only note it.
- **Fix:** Optional follow-up. Use the same raw-text buffer approach as `DiscountInput`.

## Notes
- Calculator matches spec §3. Rounding, clamping and SR-3 throws are covered by tests.
- The crud write path uses explicit column whitelists, throws on every error, and the compensating delete in `createRepair` is in place. Read mapping is typed and defensive (SR-6).
- Mapping stays in `crud/`. Only `crud/` talks to Supabase. Types come from `types/`. No `any`. `@/` imports are used. No stock components are edited.
- The migration order and transaction match spec §6. Not reviewed in depth for security.
- Open item from the brief: the store holds neither the form values nor the crud-computed totals, because it is not updated at all after a save (CR-2). Totals shown after the refetch are the DB values, which is correct.

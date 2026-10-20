# Repair discounts and persisted total price (#19)

- Branch: feature/19-repair-discounts (local commits only, not pushed)
- Contract: v3 (spec.md)
- Status: built, reviewed (round 2: 0 blockers, 0 majors). Migration run and manual checks pending.

## What shipped
- Line discounts: each repair line takes a % or kr discount. kr applies to the line total, not per unit.
- Repair discount: one % or kr discount on the repair, applied after line discounts. Never both at once.
- Calculator: `lib/repairPricing.ts` is the single source of truth. Integer øre math, round half up.
- Persisted totals: `repairs.total_price` and every `repair_items.total` are written on each create and update. Bike screen and recent repair card read `total_price`.
- Root cause of the stale total:
  - The form never set `totalPrice`, so supabase-js dropped the key.
  - Line totals were not recalculated on edit.
  - The read path recalculated from lines and ignored the stored value.
  - `updateRepair` returned errors instead of throwing, and the modal closed in `finally`.
- Modal: live Subtotal / Rabat / I alt; strict parsing and Danish validation for discounts, quantity and price; generic Danish save error; "Gemmer…" while saving; scrolling card.

## Contract v3 (crud and store)
- `createRepair` and `updateRepair` return the saved `Repair` and throw on every Supabase error.
- Totals come only from `calculateRepairTotals`. Caller `totalPrice` and item `total` are ignored.
- Explicit column whitelist on every write.
- `createRepair` deletes its repair if the item insert fails. If that delete also fails it throws `RepairSaveError` (`repairId`); the modal then switches to update on retry.
- Store: new `addRepairToStore`; the modal calls it on create and `updateRepairInStore` on update.
- `crud/repairs.ts` uses typed row mappers (`RepairRow`, `RepairItemRow`).

## Migration (required before DB checks)
File: `docs/features/19-repair-discounts/migration.sql`. Run in the Supabase SQL editor.
1. Preflight first: run only the block above the `END OF PREFLIGHT` marker. Read-only.
2. Check the output:
   - `total_price`, `price` and `total` must be numeric, or the migration aborts.
   - `quantity` type: note whether it is integer (see follow-ups).
   - `items_failing_validation` should be 0; otherwise validation aborts. Fix those rows first.
   - Paste the output (types, `relrowsecurity`, `pg_policies`, null and failing counts) into `status.md` (SR-10 gate evidence).
   - Check that `private` is not in Settings > API > Exposed schemas.
3. Run the `begin; … commit;` block. One transaction; any error leaves nothing behind.
4. Rollback (commented at end of file): restores totals from backup, drops the 13 constraints and 4 columns, in one transaction. Keep backup tables until verified, then drop them with the commented statements.

No policy, grant or RLS changes.

## Tests
- `npm test`: jest 29 + jest-expo 54. Config in `jest.config.js` (preset jest-expo, roots `Test/Claude/`).
- Last run: 6 suites, 102 tests passing. `npx tsc --noEmit` passes. `expo export --platform web` compiles.
- Manual steps: `Test/Claude/manual-checklist.md`.

## Not yet verified (no browser or DB run; code inspection only)
- DB: AC-8, AC-9, AC-15, AC-22, AC-23, AC-24, and SR-2/SR-9 on the wire.
- UI: UI halves of AC-1 to AC-6, AC-10, AC-11, AC-16 to AC-20, AC-25.
- Layout and contrast: AC-20 (375 and 320 px); AC-21 hand-computed ~5.6:1, not measured.

## Known limitations
- Save is not atomic. `updateRepair` deletes and re-inserts items; if the insert fails the repair keeps the new `total_price` with zero lines. Retry "Opdater" fixes it.
- `total_price` is not authoritative (SR-15): it is computed in the client. Don't use it for invoices or payments until auth and a server-side save exist.
- Access control is pre-existing and not changed by this feature.
- Newly added lines carry temporary item ids in the returned repair until the next refetch.
- iOS modal: no repair-level discount, no save error handling.
- Plain 2-decimal display, no Danish number formatting.

## Follow-ups (open minor findings)
| ID | Item |
|---|---|
| CR-9 | After `RepairSaveError` retry the repair isn't added to the store list. Fix: upsert in `updateRepairInStore`. |
| SEC-7 | Hardening item in the save path; details in the local security report. |
| SEC-3 | Input validation follow-up, depends on the preflight output; details in the local security report. |
| CR-10 | `displayTotals` fallback: one invalid line discount drops all line discounts from the display. |
| CR-11 | `parseNumberText`/`NumberField` duplicate DiscountInput's parse pattern. |
| CR-12 | Use `refProp` instead of `{...({ ref } as object)}`. |
| UX-10 | "Ugyldigt tal" flashes while typing a trailing `,`/`.` in Antal/Pris. |
| UX-11 | Narrow card: trash button last in tab order. |
| QA-8 | No unit tests for `parseNumberText`, `validateQuantity`, `validatePrice` (AC-25). |
| SEC-6 | Hardening item for the migration's backup tables (declined at Gate 2); details in the local security report. |
| — | Pre-existing configuration hardening item; details in the local security notes. |

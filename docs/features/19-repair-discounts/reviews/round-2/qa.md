# QA review: 19-repair-discounts, round 2

**VERDICT:** APPROVED (no blocker, no major). Remaining items are manual/DB verification.
**Scope reviewed:** `git diff 8d8c6fa..HEAD` (contract v3, fixes F-1..F-8), spec.md v3 incl. AC-25 and reworded AC-17. Mode: verify. No DB, migration not run, no browser.
**Counts:** blocker: 0 · major: 0 · minor: 3

## Commands run
- `npx tsc --noEmit`: exit 0, no output.
- `npm test`: 6 suites, 102 tests passed, 0 failed (was 78).
- `npx expo export --platform web --output-dir /tmp/claude-1000/qa-export-r2`: "Exported". Dir deleted afterwards (verified gone). No dev server started.
- No lint script exists.

## Round-1 findings re-check
| Round-1 | Fix | Result |
|---|---|---|
| QA-1 (save-error contrast) | F-7 | RESOLVED by inspection: `createRepairModal.tsx:304-305` sets `AlertTitle`/`AlertDescription` `style color: ERROR_TEXT_COLOR` (`#C62828`, `lib/theme.ts:84`, about 5.6:1 by hand). Alert icon still uses `text-destructive`; it is a graphic (3:1), not text. Not measured in a browser |
| QA-2 (qty/price validation) | F-1 | RESOLVED in code: `RepairLinesSection.tsx` `parseNumberText` strict regex, `validateQuantity`/`validatePrice` (:45-48) with the spec's Danish messages, wired via `rules` (:298, :319), raw-text buffer in `NumberField` (:110-125). No automated test (see QA-8) |
| QA-3 (no tests) | F-8 | RESOLVED for automated parts: `parseDiscountText.test.ts` (SR-5: `1e3`, `0x10`, `Infinity`, `12,345`, `5..0`, `-5`, `12,5`, empty/0), `repairPricingV3.test.ts`, `repairsCrud.test.ts` (+F-2/F-3/F-4). Manual/DB parts remain NV |
| QA-5 (read mapping) | F-8 | RESOLVED: `repairsRead.test.ts` covers SR-6 (unknown type -> null, non-finite -> 0) and AC-10 (`total_price`) |

## Traceability (AC)
PASS = seen passing in a test I ran. NV = not verified (needs DB/browser; code inspected where noted).

| ID | Result | Evidence |
|---|---|---|
| AC-1 | PASS (numbers) / NV (UI) | `repairPricing.test.ts` `AC-1:` (unchanged, passing) |
| AC-2 | PASS / NV (UI) | `AC-2:` tests |
| AC-3 | PASS / NV (UI) | `AC-3:` test |
| AC-4 | PASS / NV (UI) | `AC-4:` test |
| AC-5 | NV (code OK) | `DiscountInput` re-parses on type toggle; no test |
| AC-6 | PASS (validator) / NV (no request in UI) | `AC-6:` tests; `SR-5: parseDiscountText` tests now give "Ugyldigt tal" evidence |
| AC-7 | PASS | `AC-7 E1..E6` |
| AC-8 | NV (mock OK) | `createRepair AC-13/AC-8`; new `F-3: returns the saved Repair...` |
| AC-9 | NV (mock OK) | `updateRepair AC-9: a new line with total 0...`, `AC-13/AC-9` |
| AC-10 | PASS (mapper) / NV (render) | `repairsRead.test.ts` `AC-10: totalPrice comes from total_price...`, `AC-10: valid discounts...` |
| AC-11 | NV (code OK) | modal reset/default values; manual |
| AC-12 | PASS | `createRepair/updateRepair AC-12`, `F-2: discount value that rounds to zero...` |
| AC-13 | PASS | `AC-13/...` create and update |
| AC-14 | PASS (crud) / NV (modal) | `AC-14:` tests (insert, update, delete, item insert errors thrown; no console.error). Modal catch keeps modal open, static Danish text (inspection) |
| AC-15 | NV (SQL inspection) | `migration.sql` changed in this diff (SEC-2/SEC-5); not executed, not re-reviewed line by line by QA |
| AC-16 | NV (code OK) | `updateRepair` rewrites all state; modal keeps form on failure; needs devtools blocking |
| AC-17 (changed) | PASS (crud) / NV (modal E2E) | `AC-14/AC-17: item insert error deletes the new repair, then rethrows`; `F-4/SEC-1: insert AND compensating delete fail -> RepairSaveError with repairId and cause`; `F-4: when only the item insert fails, the original error is rethrown`. Modal: `createRepairModal.tsx` `setValue('id', error.repairId)` on `RepairSaveError`, label now from `watch('id') !== 0` so retry goes to `updateRepair` and shows "Opdater" (inspection). Not run in a browser |
| AC-18 | NV (code OK) | unchanged logic; no test |
| AC-19 | NV (code OK) | label now `watch('id') !== 0 ? 'Opdater' : 'Opret'`. Equivalent to old check for id 0 / saved ids; the old `repair &&` guard is gone (watch('id') is always defined from defaultValues). Manual check |
| AC-20 | NV | layout changed (F-5 side-by-side, UX-6); needs a browser at 320/375 px |
| AC-21 | PASS by inspection (hand-computed) / NV (measured) | discount errors and save-error alert now `#C62828` about 5.6:1; qty/price errors use the same `NumberField` error style (not separately confirmed visually) |
| AC-22 | NV (SQL inspection) | not executed |
| AC-23 | NV (SQL inspection) | not executed |
| AC-24 | NV | RLS on backups deferred (SEC-6/QA-4) |
| AC-25 (new) | NV (code OK) | Messages and rules present in code (`RepairLinesSection.tsx:45-48, 298, 319`; strict regex `parseNumberText`; submit blocked by `handleSubmit`). No automated test of `parseNumberText`/`validateQuantity`/`validatePrice`; "no request sent" and "raw text kept" need a browser. Backstop seen passing: `SR-3: invalid numbers throw before any request is sent` (crud) |

## Traceability (SR, testable)
| ID | Result | Evidence |
|---|---|---|
| SR-1 | PASS | `AC-13/...` |
| SR-2 | PASS | `SR-2:` tests (create and update) |
| SR-3 | PASS | `SR-3:` tests (calculator and crud) |
| SR-4 | PASS | `SR-4:` tests |
| SR-5 | PASS | `SR-5: parseDiscountText` (new) |
| SR-6 | PASS | `SR-6:` tests in `repairsRead.test.ts` (new) |
| SR-11 | NV (code OK) | no `console.log(data)`; static error text |
| SR-12/13 | see AC-16/AC-17 | |
| SR-14 | PASS (calculator/discount) / NV (qty/price form) | `SR-14:` tests; qty/price validators in code (AC-25) |

## Findings

### QA-8 · minor · AC-25 / F-1 validators have no automated test
- **Where:** `components/ui/RepairLinesSection.tsx` `parseNumberText`, `validateQuantity`, `validatePrice`
- **Problem:** Pure logic that implements AC-25 is untested. Like `parseDiscountText`, it could be unit tested with the same stock-component mocks (export them, or test through the file with mocks).
- **Refs:** AC-25, SR-14

### QA-9 · minor · Manual/DB verification outstanding
- **Where:** `Test/Claude/manual-checklist.md` (updated in this diff, AC-17/AC-25 entries)
- **Problem:** AC-5, 8, 9, 11, 15, 16, 18-20, 22-25 and the UI halves of AC-1..4, 6, 17 remain NV until the user runs the migration and the checklist. Not a defect.

### QA-10 · minor · Carried over, unchanged
- QA-4/SEC-6 (backup-table RLS is a comment, deferred, needs user approval), QA-6 (generic error for missing customer/bike), QA-7 (`createRepairModal.ios.tsx` unchanged). No action.

## Notes
- The modal no longer holds `checkedComplete`/`checkedPayment` state (removed in the diff); `tsc` passes and only the iOS file still declares its own, so nothing dangling.
- Web export bundling proves compile only, not runtime behaviour.

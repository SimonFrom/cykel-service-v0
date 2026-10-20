# QA review: 19-repair-discounts, round 1

**VERDICT:** CHANGES_REQUESTED
**Scope reviewed:** `git diff main...feature/19-repair-discounts` (HEAD 8d8c6fa). Mode: verify. No DB access, migration not run, no browser. DB/UI ACs verified by code inspection and mocked unit tests only.
**Counts:** blocker: 0 · major: 3 · minor: 4

## Commands run
- `npx tsc --noEmit`: exit 0, no output (pass).
- `npm test`: 3 suites, 78 tests passed, 0 failed (0.4 s).
- `npx expo export --platform web --output-dir /tmp/claude-1000/qa-export`: succeeded ("Exported"), all routes incl. `/createRepairModal` bundled. Temp dir deleted.
- `prettier --check`: only pre-existing files (lib/theme.ts, crud/bikes.ts, crud/customers.ts) flagged; none from this feature.
- No lint script exists in the project.

## Traceability (AC)
PASS = seen passing in a test or confirmed in code. NV = not verified (needs manual/DB check; see `Test/Claude/manual-checklist.md`).

| ID | Result | Evidence |
|---|---|---|
| AC-1 | PASS (numbers) / NV (UI) | test `AC-1: 150 x 2 with 10 %...`; UI wiring `RepairLinesSection.tsx:271` (`money(line.net)`), subtotal :298 |
| AC-2 | PASS / NV (UI) | test `AC-2: 350 x 1 with 50 kr`, `AC-2: flat line discount applies to the line total` |
| AC-3 | PASS / NV (UI) | test `AC-3: subtotal 570, 5 %`; footer :298/:323/:330 |
| AC-4 | PASS / NV (UI) | test `AC-4: subtotal 570, 100 kr` |
| AC-5 | NV (code OK) | `DiscountInput.tsx:89` `handleType` re-parses raw text with new type; single `discount` field, so only one type possible. No automated test |
| AC-6 | PASS (validator) / NV (UI, no request) | tests `AC-6:*` for messages; `DiscountInput.tsx:12-26` strict parse (NaN -> "Ugyldigt tal"); `rules.validate` at `RepairLinesSection.tsx:181`, :303; `handleSubmit` blocks. "No request" needs Network tab |
| AC-7 | PASS | tests `AC-7 E1`..`E6` |
| AC-8 | NV (code + mock OK) | test `createRepair AC-13/AC-8: persists calculator totals`; real DB write not seen |
| AC-9 | NV (code + mock OK) | tests `updateRepair AC-9: a new line with total 0 ... real total`, `AC-13/AC-9` |
| AC-10 | NV (code OK) | `crud/repairs.ts` `mapRepairRow` reads `total_price`; `[bikeId].tsx:106` and `recentRepairCard.tsx:61` render it with `toFixed(2)`. No mapper test (QA-5) |
| AC-11 | NV (code OK) | `discount` in modal `defaultValues`/`reset`; `DiscountInput` syncs from value (:77). Manual check needed |
| AC-12 | PASS | tests `createRepair AC-12`, `updateRepair AC-12`, `AC-12: a 0 discount behaves like no discount`; `parseDiscountText` maps 0 to null |
| AC-13 | PASS | tests `createRepair/updateRepair AC-13/...: ignoring caller totalPrice and item totals` |
| AC-14 | PASS (crud) / NV (modal) | tests `AC-14: a repair insert error is thrown`, `repair update error is thrown`, `item delete error is thrown`, `item insert error is thrown`, `does not console.error`. Modal: `createRepairModal.tsx` catch sets `saveError`, no close, Danish text, no raw message (inspection) |
| AC-15 | NV (SQL inspection OK) | `migration.sql:111-118` backfill matches spec; not executed |
| AC-16 | NV (code OK) | modal resets/closes only after success (`onSubmit`); `updateRepair` rewrites everything on retry. Needs devtools blocking |
| AC-17 | PASS (crud) / NV (E2E) | tests `AC-14/AC-17: item insert error deletes the new repair, then rethrows`, `AC-17: original error is thrown even if the compensating delete also fails` |
| AC-18 | NV (code OK) | `showFooter = fields.length>0 \|\| repairDiscount != null` (:94); discount kept on `remove`; revalidation via `baseKey` effect (:97-108). No automated test |
| AC-19 | NV (code OK) | `createRepairModal.tsx` label `repair && repair.id !== 0 ? 'Opdater' : 'Opret'` |
| AC-20 | NV | `ScrollView` with maxHeight 90%, narrow stacking <768 in code; layout/horizontal scroll at 320 px needs a browser |
| AC-21 | FAIL (save-error Alert) / PASS (discount errors) | Discount errors and `styles.error` use `#C62828` (about 5.6:1). The save-error `Alert variant="destructive"` uses theme `text-destructive` = `hsl(0 84.2% 60.2%)` (about #EF4444), about 3.8:1 on white, below 4.5:1; AlertDescription is `/90`, lower still. See QA-1 |
| AC-22 | NV (SQL inspection OK) | constraints in `migration.sql:70-107` match spec §6 names/checks. Not executed |
| AC-23 | NV (SQL inspection OK) | single `begin/commit`, preflight raises on non-numeric, `NOT VALID` then `VALIDATE`. Not executed |
| AC-24 | NV (inspection OK) | backups in `private` schema, only readable if the project exposes `private`; the optional RLS step is a comment only. See QA-4 |

## Traceability (SR, testable ones)
| ID | Result | Evidence |
|---|---|---|
| SR-1 | PASS | tests `AC-13/...` |
| SR-2 | PASS | tests `SR-2: repair_items insert sends exactly the whitelisted columns`, `SR-2: repairs update never sends id or created_at...` |
| SR-3 | PASS | tests `SR-3: ...` (calculator, 18) and `SR-3: invalid numbers throw before any request is sent` (create and update) |
| SR-4 | PASS | tests `SR-4: ...` (5) |
| SR-5 | NV (code OK) | `parseDiscountText` regex per spec; no unit test (QA-3) |
| SR-6 | NV (code OK) | `toNumber`/`mapDiscount` in `crud/repairs.ts`; no mapper test (QA-5) |
| SR-11 | NV (code OK) | `console.log(data)` removed; error UI is static Danish text |
| SR-12/13 | see AC-16/AC-17 | |
| SR-14 | PASS | tests `SR-14: ...`, `SR-14: every validator-accepted discount is accepted by the calculator`. Gap: quantity <= 0 and negative price are not validated in the form (QA-2) |

## Findings

### QA-1 · major · Save-error alert fails contrast requirement
- **Where:** `app/createRepairModal.tsx` (`<Alert variant="destructive">`), theme `lib/theme.ts:19` / `global.css:21`
- **Problem:** `text-destructive` is `hsl(0 84.2% 60.2%)`, about 3.8:1 on a white card. AC-21 requires >= 4.5:1 for every error text added by the feature, including the save error. Computed by hand; not measured in a browser.
- **Fix:** Style the title/description with `ERROR_TEXT_COLOR` (`#C62828`) instead of the theme class (do not edit the stock Alert).
- **Refs:** AC-21, WCAG 1.4.3, B-4

### QA-2 · major · Invalid quantity/price cannot be caught by form validation; user only sees the generic save error
- **Where:** `components/ui/RepairLinesSection.tsx:222`, :240 (`Number(t) || 0`); `lib/repairPricing.ts` throws on quantity <= 0 or negative price
- **Problem:** Quantity 0 (also what an emptied field becomes) or a negative price passes form validation. On "Opret"/"Opdater" the calculator throws, no request is sent, and the user sees "Reparationen kunne ikke gemmes" with no hint about the cause. SR-14 says a valid form must not hit constraints; here the form is "valid" but unsavable. Spec §10 puts price/quantity parsing out of scope, so this is a usability gap rather than a spec violation, but it is reachable in normal use (clear the quantity field).
- **Fix:** Add `rules` on quantity (> 0) and price (>= 0) with Danish messages, or confirm with the spec owner that the generic error is acceptable.
- **Refs:** SR-3, SR-14

### QA-3 · major · UI-level ACs have no automated test and the DB/E2E ACs have not been run
- **Where:** `Test/Claude/` (only `lib/repairPricing` and `crud/repairs` write path covered)
- **Problem:** AC-5, AC-6 (request not sent), AC-8..AC-11, AC-15..AC-20, AC-22..AC-24 and SR-5/SR-6 were not exercised by any test I could run. Spec §9 assigns these to manual checks (`manual-checklist.md`), and the migration has not been run, so none is verified. `parseDiscountText` (SR-5) is a pure function and can be unit tested without new libraries.
- **Fix:** Run the manual checklist after the migration and record results; add unit tests for `parseDiscountText` (`12,5`, `1e3`, `0x10`, `12,345`, `5..0`, `-5`, empty, `0`) and the read mappers.
- **Refs:** SR-5, SR-6, AC list above

### QA-4 · minor · Backup tables' RLS is only a comment
- **Where:** `docs/features/19-repair-discounts/migration.sql:48-50`
- **Problem:** AC-24 depends on `private` not being exposed by PostgREST. If the project exposes it, the user must run the commented `enable row level security` lines by hand; nothing in the script enforces or checks it.
- **Fix:** Enable RLS on both backup tables unconditionally (no policies); this does not touch existing policies.
- **Refs:** AC-24, SR-9

### QA-5 · minor · Read mapping untested
- **Where:** `crud/repairs.ts` `mapRepairRow`/`mapItemRow` (not exported, only reachable via `getRepairs`)
- **Problem:** AC-10/SR-6 behaviour (reads `total_price`, unknown `discount_type` -> null, NaN -> 0) has no test.
- **Fix:** Test `getRepairs`/`getAllRepairs` with the same Supabase mock used in `repairsCrud.test.ts`.
- **Refs:** AC-10, SR-6

### QA-6 · minor · Missing customer/bike gives no distinct error
- **Where:** `app/createRepairModal.tsx` `onSubmit`
- **Problem:** Shows the same "kunne ikke gemmes" text; acceptable, noted only.

### QA-7 · minor · Native variant differs
- **Where:** `app/createRepairModal.ios.tsx` (unchanged, per spec §9)
- **Problem:** Gets line discounts via the shared section but not the repair discount field, error handling or submit-label change. Noted per CLAUDE.md; no action unless asked.

## Notes
- Calculator and crud write path implement spec §3/§5.3 as written (whitelisted payloads, throw-before-request, compensating delete, throwing `updateRepair`).
- Migration SQL matches spec §6 step order and has none of the forbidden statements (grep by eye: no policy/grant/revoke/security definer).
- Web export bundles; this does not prove runtime behaviour. No dev server was started, so no processes to clean up.

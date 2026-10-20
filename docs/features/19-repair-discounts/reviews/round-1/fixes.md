# Fixes: 19-repair-discounts, round 1

Sources: `code.md` (CR-*), `security.md` (SEC-*), `qa.md` (QA-*), `ux.md` (UX-*). 0 blockers; 8 majors after de-duplication.

## Contract change v3 (post-Gate 1 — listed to the user at Gate 2)
Both developers code against this; backend implements it.
- `lib/repairPricing.ts` adds:
  - `roundMoney(value: number): number` — 2-decimal, round half up (same øre rounding as the calculator).
  - `tryCalculateRepairTotals(items, discount): RepairTotals | null` — same as `calculateRepairTotals` but returns `null` instead of throwing (for live UI display).
- `crud/repairs.ts`:
  - `createRepair(repair: Omit<Repair, 'id'>): Promise<Repair>` — returns the saved repair (new id, calculator totals, normalised discounts), not a number.
  - `updateRepair(id: number, repair: Repair): Promise<Repair>` — returns the saved repair.
  - `export class RepairSaveError extends Error { repairId: number }` — thrown by `createRepair` when the item insert fails **and** the compensating delete also fails; `cause` = original error. The repair row with `repairId` still exists.
- `store/repairStore.ts` adds `addRepairToStore(repair: Repair): void` (prepend to `repairs`, set `selectedRepair`). `updateRepairInStore` stays.

## To fix (blockers and majors)
| ID | Severity | Owner | Summary | Also reported as |
|---|---|---|---|---|
| F-1 | major | frontend | Antal/Pris: raw-text buffer + strict parse (no `Number(t) \|\| 0`), form `rules.validate` quantity > 0 and price ≥ 0 with Danish messages ("Antal skal være større end 0", "Pris skal være 0 eller mere", "Ugyldigt tal"); revalidate discounts when they change | CR-1, QA-2, SEC-3 (form half), UX-7, CR-8 |
| F-2 | major | backend | Round line `price` with `roundMoney` before calculating and writing; `discountColumns` rounds before the zero check | SEC-3 (crud half), SEC-4 |
| F-3 | major | backend + frontend | Store reflects saved values without refetch: crud returns saved `Repair` (contract v3); modal calls `addRepairToStore` / `updateRepairInStore` with the returned value; remove unused code | CR-2, CR-7 |
| F-4 | major | backend + frontend | `createRepair`: check the compensating delete's error; if it fails throw `RepairSaveError` with `repairId`. Modal: on `RepairSaveError` `setValue('id', err.repairId)` so retry goes through `updateRepair`; still shows the generic Danish error | SEC-1 |
| F-5 | major | frontend | Wide layout: Antal and Pris side by side (`flexDirection: 'row'` on the wrapper) aligned with headers | UX-1 |
| F-6 | major | frontend | Live discount validation: revalidate on `%`/`kr` toggle and on invalid text (include type and `String(value)` in the revalidation key, repair-level too) — or `mode: 'onTouched'` + trigger on toggle | UX-2 |
| F-7 | major | frontend | Save-error Alert text ≥ 4.5:1 contrast — use the shared error colour | QA-1, UX-9 |
| F-8 | major | tests | Add tests: `parseDiscountText` (SR-5 rejects `1e3`, `0x10`, `Infinity`, `-5`, `12,345`; accepts `12,5`, `12.50`), read mappers (SR-6: unknown type → null discount, non-finite → 0, `totalPrice` from `total_price`), contract v3 (create/update return saved Repair with calculator totals; `RepairSaveError` when insert and delete both fail; `roundMoney`; `tryCalculateRepairTotals` returns null for invalid input), price rounding (F-2) | QA-3, QA-5, SEC-1 test |

### Trivial minors included (files already being touched)
| ID | Owner | Summary |
|---|---|---|
| CR-3 | backend + frontend | Backend adds `tryCalculateRepairTotals` (contract v3); frontend replaces `safeTotals`/`withRepair` with it — no øre rounding outside `lib/repairPricing.ts` |
| CR-4 | backend | Compute totals once per create/update; no calculator call used only for its throw side effect |
| CR-5 | frontend | Move `ERROR_TEXT_COLOR` to `lib/theme.ts`; keep `refProp` where it is or move to `lib/utils.ts` |
| UX-3, UX-4 | frontend | `%`/`kr` toggle: plain buttons with `aria-pressed` in a labelled group (drop radiogroup/radio roles); accessible names include visible text, e.g. "% (procent)", "kr (kroner)" |
| UX-5 | frontend | After a failed save, return focus to the submit button |
| UX-6 | frontend | Narrow card: trash button top-right, ≥ 44×44 target |
| SEC-2 | backend | Preflight also reports `is_nullable` and null counts for price/quantity/total/total_price; constraints SR-7d–g use `x is not null and …` |
| SEC-5 | backend | Split the preflight into a separate, clearly marked query block at the top of `migration.sql` with an instruction to run it alone first and paste its output into `status.md` |

## Deferred (minors)
| ID | Summary |
|---|---|
| SEC-6 / QA-4 | Enable RLS + `revoke all on schema private from anon, authenticated` on backup tables — touches RLS/grants; CLAUDE.md requires asking first. Raise at Gate 2 |
| UX-8 | Verify footer Rabat row at 320px / 400% zoom — manual checklist |
| CR-6 / QA-7 | `createRepairModal.ios.tsx` differs from web — intentionally unchanged; mention at Gate 2 |
| QA-6 | Missing customer/bike shows the generic save error |
| QA-3 (manual part) | Manual checklist + DB-backed ACs require the user to run the migration |
| — | npm audit: 23 dev-only advisories from jest (micromatch); pre-existing prod advisories (`ws` etc.) — separate ticket |

## Disputes
| ID | Developer's argument | Ruling |
|---|---|---|
| UX-3 | Team lead had accepted Tab-only fallback | UX reviewer disputed: fallback in ux.md is `aria-pressed` buttons, not radiogroup. Accepted — fix included above |

## Reviewer conflicts
- QA-2 vs spec §10 (price/quantity parsing out of scope): SR-14 (form rejects what the DB rejects) takes precedence — security wins; F-1 included.

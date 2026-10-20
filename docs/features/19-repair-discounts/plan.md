# Plan: Repair discounts (#19)

- **Spec:** `docs/features/19-repair-discounts/spec.md` (contract v2, Gate 1 approved)
- **Security:** `security-design.md` (SR-1..SR-15) · **UX:** `ux.md`
- **Branch:** `feature/19-repair-discounts` from `main`

## File ownership
| Owner | May modify |
|---|---|
| backend-developer | `types/` (shared, step 1), `lib/repairPricing.ts` (shared, step 1), `package.json` / `package-lock.json` / `jest.config.js` (shared, step 1), `crud/repairs.ts`, `store/repairStore.ts`, `docs/features/19-repair-discounts/migration.sql` |
| frontend-developer | `components/ui/DiscountInput.tsx` (new), `components/ui/RepairLinesSection.tsx`, `app/createRepairModal.tsx`, `components/ui/recentRepairCard.tsx`, `app/(tabs)/customers/[id]/**` (only where totals are displayed, AC-10) |
| qa-engineer | `Test/Claude/**` |

Not to be touched: `components/ui/stock components/**`, `app/createRepairModal.ios.tsx`, `components/ui/createRepairForm.tsx`, `CLAUDE.md`, RLS/auth.

## Tasks
| ID | Tag | Task | Covers | Owner |
|---|---|---|---|---|
| T-1 | [shared] | `types/discount.ts`; add `discount` to `Repair` and `RepairItem` (spec §4) | AC-5, AC-11, AC-12 | backend |
| T-2 | [shared] | `lib/repairPricing.ts`: `calculateLineTotals`, `calculateRepairTotals`, `validateDiscount`, øre-integer math, SR-3 throws, SR-4 rounding (spec §3, §5.2) | AC-1..AC-7, AC-12, SR-3, SR-4, SR-14 | backend |
| T-3 | [shared] | Test setup: devDeps `jest` + `jest-expo`, `jest.config.js` (preset jest-expo, roots `Test/Claude`), `"test": "jest"` script | AC-7 | backend |
| T-4 | [backend] | `migration.sql` per spec §6: one transaction, preflight (types/RLS/policies, abort if non-numeric), backup to `private` schema, columns, 9 named constraints (NOT VALID → VALIDATE after backfill), backfill, rollback block; no policy/grant/definer | AC-15, AC-22..AC-24, SR-7..SR-10 | backend |
| T-5 | [backend] | `crud/repairs.ts`: typed rows, defensive mappers (SR-6), read `total_price` + discount cols, compute+write totals via calculator only (SR-1), explicit column whitelist (SR-2), all functions throw, compensating delete in `createRepair` (§5.3). Update `store/repairStore.ts` only if signatures change | AC-8..AC-10, AC-12..AC-14, AC-17, SR-1, SR-2, SR-6, SR-13 | backend |
| T-6 | [frontend] | `DiscountInput.tsx`: input + `%`/`kr` toggle (radiogroup), raw-text buffer, strict parse (SR-5), a11y per `ux.md` | AC-5, AC-6, SR-5 | frontend |
| T-7 | [frontend] | `RepairLinesSection.tsx`: Rabat column, 2-decimal net totals from calculator, footer Subtotal/Rabat/I alt with aria-live, AC-18 visibility, new lines `discount: null`, narrow layout <768px | AC-1..AC-5, AC-18, AC-20 | frontend |
| T-8 | [frontend] | `createRepairModal.tsx`: discount in defaults/reset, `validateDiscount` rules + revalidate on base change, close only on success, Danish save error Alert, label by `repair.id !== 0`, `Gemmer…`, scroll container, AA error colour, remove `console.log(data)` | AC-6, AC-11, AC-14, AC-16, AC-17, AC-19..AC-21, SR-11, SR-12 | frontend |
| T-9 | [frontend] | Bike screen + `recentRepairCard.tsx` display `repair.totalPrice` (from DB) | AC-10 | frontend |
| T-10 | [tests] | `Test/Claude/repairPricing.test.ts`: E1–E6, validateDiscount boundaries/messages, SR-3 throws; `Test/Claude/manual-checklist.md` for UI/DB ACs (AC-8..AC-24) | AC-7, SR-3, SR-14, all (manual) | qa |

## Order
1. Backend does T-1..T-3 first; committed to `feature/19-repair-discounts`.
2. In parallel worktrees: backend T-4, T-5 · frontend T-6..T-9 · qa T-10.

## Verification commands
```bash
# lint:      none defined
# typecheck: npx tsc --noEmit
# test:      npm test
# build:     none defined (web smoke: npm run web)
```

## Risks / notes
- The migration must be run by the user before DB-backed ACs (AC-8..AC-17, AC-22..AC-24) can be verified; until then those are verified by code review + manual checklist only.
- `createRepairModal.ios.tsx` will diverge (no repair-level discount or error handling); mention at Gate 2, don't change.
- Prettier already fails on 38 files repo-wide; only format files touched by this feature.
- SR-13 resolved by compensating delete in `createRepair` (spec-writer choice; accepted by team lead).

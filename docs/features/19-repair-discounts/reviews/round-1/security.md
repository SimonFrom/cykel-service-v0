# Security review: 19-repair-discounts, round 1

**VERDICT:** CHANGES_REQUESTED
**Scope reviewed:** `git diff main...feature/19-repair-discounts` (HEAD 8d8c6fa): `crud/repairs.ts`, `lib/repairPricing.ts`, `app/createRepairModal.tsx`, `components/ui/DiscountInput.tsx`, `components/ui/RepairLinesSection.tsx`, `types/*`, display changes in `app/(tabs)/customers/[id]/[bikeId].tsx` and `components/ui/recentRepairCard.tsx`, `docs/features/19-repair-discounts/migration.sql` (static only, it hasn't been run), `package.json`, `package-lock.json`, `jest.config.js`, `Test/Claude/*`.
**Counts:** blocker: 0 · major: 1 · minor: 5

## Findings

### SEC-1 · major · Orphan repair on failed create when the compensating delete fails (SR-13 / AC-17)
- **Where:** `crud/repairs.ts:176-180`
- **Problem:** When the `repair_items` insert fails, `createRepair` runs `await supabase.from('repairs').delete().eq('id', repairId)` but never checks the result. The likeliest real cause of a failed item insert is lost connectivity, and in that case the delete fails too. The repair row then stays in the DB with the full `total_price` (written at line 153) and no lines. The modal still has `id = 0`, so the user's retry goes through `createRepair` again and creates a second repair. The bike screen ends up showing two repairs, one of them a priced repair with no lines. That's the silent duplicate SR-13 forbids. The AC-17 devtools test only blocks `POST /rest/v1/repair_items`, so it lets the delete through and won't catch this.
- **Fix:** Check `error` from the compensating delete. If it fails, throw an error that carries the id (e.g. `class RepairCreatePartialError extends Error { constructor(public repairId: number, cause: unknown) … }`). In `app/createRepairModal.tsx:104-113`, catch it and `setValue('id', err.repairId)` so the retry goes through `updateRepair`, which rewrites all lines. A simpler option is to always take the keep-the-id route (the other option SR-13 allows) and skip the delete. Add a test in `Test/Claude/repairsCrud.test.ts` where both the item insert and the delete return an error.
- **Refs:** SR-13, AC-17, T-6

### SEC-2 · minor · CHECK constraints on pre-existing columns pass on NULL
- **Where:** `docs/features/19-repair-discounts/migration.sql:91-93, 97-107`, preflight `:10-15`
- **Problem:** `check (price >= 0)`, `check (quantity > 0)`, `check (total >= 0 and total <= round(price * quantity, 2))`, `check (total_price >= 0)` and `repair_items_discount_amount_max_chk` all evaluate to NULL, which means pass, when `price`, `quantity`, `total` or `total_price` is NULL. Nobody has checked whether those columns are nullable: there's no schema in the repo, the preflight doesn't select `is_nullable`, and `RepairItemRow`/`RepairRow` type them as `| null`. If they are nullable, a direct PostgREST call can write e.g. `price = null, discount_type = 'amount', discount_value = 99999999` and get past SR-7d/e/f/g. The read mapper turns the nulls into 0 (`crud/repairs.ts:39-42`). The row then can't be edited, because the calculator throws on `quantity = 0`. Real impact is low: the anon key can already write any value or delete rows (T-10). So this is a gap in the SR-7 control, not a new exploit. The new columns are safe: `discount_value` is `not null`, so the consistency check is null-safe.
- **Fix:** Add `is_nullable` to the preflight select at line 10. Then either make the checks null-rejecting, e.g. `check (price is not null and price >= 0)`, `check (quantity is not null and quantity > 0)`, `check (total is not null and total >= 0 and total <= round(price * quantity, 2))`, `check (total_price is not null and total_price >= 0)`, or add `alter column … set not null`. The second option is a schema change, so it needs user approval per CLAUDE.md.
- **Refs:** SR-7, T-2

### SEC-3 · minor · Line `price`/`quantity` aren't normalised before calculation and write
- **Where:** `crud/repairs.ts:92-93`; `components/ui/RepairLinesSection.tsx:222, 240`
- **Problem:** The calculator uses `toOre(price)`, which rounds to 2 dp, but `buildItemRows` writes the raw `item.price`. A `numeric(10,2)` column then rounds it again in Postgres. With `price = 10.005`, JS gives `Math.round(1000.4999…) = 1000`, so the line total is 10.00, while PG stores the price as 10.01. That breaks the consistency T-5 asked for. The price and quantity inputs still use `Number(t) || 0`, which accepts `1e3`, `0x10`, `10.005`, `-5` and fractional quantities. SR-3 does stop non-finite, negative and oversized values before any request, which is good. Two gaps remain. (a) Silent price drift. (b) If `repair_items.quantity` turns out to be an integer column (the preflight will show this), a quantity of `1.5` gets rejected by PostgREST after `updateRepair` has already deleted the lines. That's exactly the T-6 empty-repair path, and it contradicts SR-14 (a valid form must never hit a DB error). Today the user only sees the generic error, with no hint why.
- **Fix:** In `buildItemRows`, write `price: roundMoney(item.price)`, with a `roundMoney = (x) => Math.round(x * 100) / 100` helper exported from `lib/repairPricing.ts` and used by both the calculator and the crud layer. Add react-hook-form `validate` rules on `items.${i}.price` and `items.${i}.quantity` that reuse the strict `DECIMAL_RE` and show Danish messages. If `quantity` is an integer column, also reject non-integers, both client-side and in `lineOre` (`lib/repairPricing.ts:75-82`).
- **Refs:** SR-3, SR-4, SR-14, T-5, T-6

### SEC-4 · minor · `discountColumns` checks for zero before rounding
- **Where:** `crud/repairs.ts:52-55`
- **Problem:** `discount.value === 0` is tested on the raw value, but the value written is `Math.round(value * 100) / 100`. With `{ type: 'percent', value: 0.004 }` the code writes `discount_type = 'percent', discount_value = 0`. That violates `*_discount_consistency_chk` (`migration.sql:79-80, 89-90`), so the save fails, and on the update path it fails after the lines have been deleted. The form can't produce this value, because `DECIMAL_RE` allows at most 2 dp, so only direct `crud/` callers can hit it. `validateDiscount` (`lib/repairPricing.ts:118-131`) also accepts 0.004.
- **Fix:** Round first, then compare: `const v = discount ? Math.round(discount.value * 100) / 100 : 0; return v === 0 ? { discount_type: null, discount_value: 0 } : { discount_type: discount!.type, discount_value: v };`. Do the same in `discountOre` (`lib/repairPricing.ts:66`), which already works on the rounded value.
- **Refs:** SR-4, SR-7c, SR-14, AC-12

### SEC-5 · minor · Preflight output (SR-8/SR-10 evidence) may not be visible when run as one script
- **Where:** `docs/features/19-repair-discounts/migration.sql:7-22`; `docs/features/19-repair-discounts/status.md`
- **Problem:** The three preflight `select`s run inside the same script as the migration and end with `commit`. As far as I know, the Supabase SQL editor only shows the result of the last statement. If so, the column types, RLS state and `pg_policies` output that SR-10 requires in `status.md` never appear. Running the file once in a test project would confirm. `status.md` has no evidence yet, which is expected because the migration hasn't run.
- **Fix:** Move section 1 into a separate, read-only `preflight.sql`, or add a note to run lines 10-22 as their own query first. Paste the output, including `is_nullable` from SEC-2 and the `quantity` data type from SEC-3, into `status.md` before running the migration. Gate 2 should check that the evidence is there.
- **Refs:** SR-8, SR-10

### SEC-6 · minor · Backup-table hardening is left as an optional comment
- **Where:** `docs/features/19-repair-discounts/migration.sql:47-58`
- **Problem:** The backup tables live in `private`, which Supabase doesn't expose by default, so SR-9 is met. But the `enable row level security` lines are only a comment, and they depend on the operator knowing whether `private` is exposed. Running them is cheap and makes the outcome independent of project config.
- **Fix:** Run `alter table private.repair_items_total_backup_19 enable row level security;` and the same for `repairs_total_price_backup_19` unconditionally, plus `revoke all on schema private from anon, authenticated;`. A `revoke` is allowed here: it narrows access, and SR-10's grep targets widening. Mention it explicitly in the SR-10 evidence so the grep result is understood.
- **Refs:** SR-9, T-8

## Previously reported (round ≥ 2)
| ID | Status: fixed / still open / accepted-dispute |
|---|---|
| (none, round 1) | |

## SR verification

| SR | Result | Evidence |
|---|---|---|
| SR-1 | pass | `total_price: totals.total` at `crud/repairs.ts:153, 198`, `total: lines[i].net` at `:94`. Caller `totalPrice` / `items[].total` are never read. |
| SR-2 | pass | Explicit object literals at `crud/repairs.ts:89-97, 150-163, 195-208`, no spreads. The update omits `id` and `created_at`. Item columns are exactly `repair_id, title, price, quantity, total, discount_type, discount_value`. |
| SR-3 | pass | `calculateRepairTotals` and `buildItemRows` run before the first request (`crud/repairs.ts:143-145, 188-190`). Bounds, finiteness and safe-integer checks are in `lib/repairPricing.ts:18-35, 47, 74-84, 102-104`. See SEC-3 for price normalisation. |
| SR-4 | pass (edge case SEC-4) | Rounded value written at `crud/repairs.ts:55`, the same rounding used in the calculation at `lib/repairPricing.ts:54`. A null discount is written as `null/0` at `:53-54`. |
| SR-5 | pass | `DECIMAL_RE` at `components/ui/DiscountInput.tsx:12`, strict parse at `:17-26`. Whitespace-only input means no discount, which matches spec §7 l.236 ("Empty means no discount"). `Number(t) \|\| 0` isn't used for discount fields. |
| SR-6 | pass | `toNumber` / `mapDiscount` at `crud/repairs.ts:39-49`. Typed `RepairRow` / `RepairItemRow` at `:8-34`, no `any`. |
| SR-7 | pass (gap SEC-2) | a/b/c on both tables at `migration.sql:72-90`, d at `:91-93`, e/f at `:97-103`, g at `:105-107`, `NOT VALID` then `VALIDATE` at `:122-125`. Not null-safe for nullable legacy columns (SEC-2). |
| SR-8 | pass (static) | `begin;`/`commit;` at `migration.sql:5, 129`. Preflight at `:10-22`. The type guard `do` block at `:25-40` aborts instead of converting, which gate 1 accepted ("columns already numeric"). The runtime abort test is not verifiable (no DB). |
| SR-9 | pass (static) | Backup in `private` schema at `migration.sql:52-58`, before the backfill at `:111-118`. Restore and drop instructions at `:131-170`. The anon `GET` test is not verifiable. See SEC-6. |
| SR-10 | not verifiable | The grep for `create policy\|alter policy\|grant\|revoke\|disable row level\|security definer` in `migration.sql` only matches the comment on line 3. There's no preflight / `pg_policies` evidence in `status.md` yet (the migration hasn't run). See SEC-5. |
| SR-11 | pass | Generic Danish alert at `app/createRepairModal.tsx:286-291`. Only `console.error(error)` at `:110`. No `console.log` left in the modal, `crud/repairs.ts`, `lib/` or the new components. |
| SR-12 | pass | Throws on repair update, item delete and item insert at `crud/repairs.ts:211, 216, 221`. The modal returns early on a catch without `reset()` (`app/createRepairModal.tsx:109-114`), so the form state, discounts included, stays intact. A retry rewrites all lines. |
| SR-13 | fail (partial) | Compensating delete at `crud/repairs.ts:178`, but its error isn't checked. See SEC-1. |
| SR-14 | pass (gaps SEC-3, SEC-4) | `validateDiscount` at `lib/repairPricing.ts:118-131` covers ≥0, ≤100 %, amount ≤ base (øre comparison) and non-finite values. It's wired to the line field (`RepairLinesSection.tsx:181-184`) and the repair field (`:303-305`). Price and quantity have no form rules: they're caught by the calculator throw (generic error, no request), apart from the edge cases in SEC-3. |
| SR-15 | pass | Spec §8, `docs/features/19-repair-discounts/spec.md:247`. |

## Notes

- **NOT VALID semantics:** Postgres enforces `NOT VALID` CHECK constraints on any later `UPDATE`. So a legacy row with `price < 0` or `quantity <= 0` makes the backfill `update` at `migration.sql:111-112` fail, before `VALIDATE` at `:122-125` is reached. The outcome is the same (the whole transaction aborts, nothing persists), but the comment at `:120` suggests the failure point is step 7. The informational count at `:43-45` lists exactly those rows, which is useful before a run.
- **Null-safety, new columns:** `discount_type in (...)` passes for NULL by design (NULL means no discount). The consistency check `(discount_type is null) = (discount_value = 0)` is fully determined because `discount_value` is `not null default 0`. The percent max uses `is distinct from`. All correct.
- **Rollback:** it restores totals from the backup, drops the constraints and columns, and keeps the backup tables until gate 2. Correct.
- **XSS:** No `dangerouslySetInnerHTML` in `app/` or `components/`. The new values are numbers rendered with `toFixed(2)` through RN `<Text>`. Line titles show up in `aria-label`s only as attributes. No sinks.
- **Secrets:** No keys, `service_role` or Supabase URLs in the diff. `.env` is unchanged. `Test/Claude/*` mocks the client and doesn't need credentials.
- **devDependencies:** `jest` 29.7.0, `jest-expo` 54.0.18 and `@types/jest` 29.5.14 are in `devDependencies` (`package.json` diff) and flagged `"dev": true` in `package-lock.json`. The lockfile also bumped a few prod transitives (`@expo/config` 12.0.13→12.0.14, `@expo/config-plugins` 54.0.4→54.0.5, `@expo/json-file`, `@expo/plist`, `hasown`, `@babel/helper-validator-identifier`), which are patch-level.
- **`npm audit --package-lock-only`, run on both lockfiles:**
  - Production (`--omit=dev`): main 59 (2 critical, 39 high), branch 57 (2 critical, 37 high). No new production advisories; two fewer.
  - All deps: branch 82 vs main 59. The 23 new entries are all jest packages, rooted in `micromatch` (already present in prod via Expo). They're dev-only test tooling that never ships in the bundle, so no finding.
  - The pre-existing prod advisories (e.g. `ws` GHSA-96hv-2xvq-fx4p) are out of scope for this feature. They're worth a separate `npm audit fix` ticket.
  - No tools were installed; I used the existing `npm audit`.
- **Pre-existing, unchanged by this diff (backlog, see security-design §6):**
  - RLS is probably open to anon.
  - `.env` is tracked in git.
  - `getRepair` swallows errors (`crud/repairs.ts:132-135`).
  - `console.log(error)` in `crud/bikes.ts:26` and `crud/customers.ts:84`.
  - `updateRepair` accepts any `bike_id` / `customer_id` from the caller. Not exploitable beyond what anon can already do via PostgREST. Revisit with auth.

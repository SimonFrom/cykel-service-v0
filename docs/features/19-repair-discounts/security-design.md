# Security design: 19-repair-discounts

- **Spec:** `docs/features/19-repair-discounts/spec.md` (contract v1)
- **Author:** security-engineer (design mode), 2026-10-20
- **Scope:** line and repair discounts, persisting `repairs.total_price` / `repair_items.total` from `crud/`, the migration in spec §6 (new columns, check constraints, backfill).

## 1. Assets and data classification

| Asset | Where | Classification | Notes |
|---|---|---|---|
| Line price, quantity, discount, net total | `repair_items.price/quantity/discount_type/discount_value/total` | Commercial, integrity-sensitive | Basis for what the customer is charged. |
| Repair discount and final total | `repairs.discount_type/discount_value/total_price` | Commercial, integrity-sensitive | AC-10 makes `total_price` the value shown to staff, so it becomes the de facto amount charged. |
| Existing `total`/`total_price` values | same tables | Integrity (historic) | Overwritten by the backfill (OQ-7). |
| Customer PII (name, phone, email …) | `customers` | PII | Not touched by this feature. It shares the same anon-key exposure (see §6 pre-existing items). |
| Supabase anon key + URL | `.env` → `EXPO_PUBLIC_*` → client bundle | Public by design | It gives no protection on its own. All protection comes from RLS. |

No new PII, credentials or secrets are introduced.

## 2. Trust boundaries and entry points

1. **Browser / app → Supabase PostgREST** (anon role). This is the only real boundary. Anything the client computes, including the `lib/repairPricing.ts` output, is untrusted at the DB. Anyone with the anon key can call PostgREST directly and bypass the form and `crud/`.
2. **Form input → calculator → `crud/` payload** (inside the client). Not a security boundary, but it decides whether the honest client writes consistent, constraint-valid data.
3. **DB rows → `crud/` mappers → UI.** Values from the DB, including rows written by other clients, SQL editor edits or the iOS modal, are untrusted input to the mappers.
4. **Migration (SQL editor, `postgres` role).** Runs with full privileges, outside RLS. A one-off but high-impact entry point.

Entry points touched: `createRepair`, `updateRepair`, `getRepairs`, `getAllRepairs`, `getRepair` in `crud/repairs.ts`. PostgREST `POST/PATCH/DELETE /rest/v1/repairs` and `/rest/v1/repair_items`. `migration.sql`.

## 3. Threats (STRIDE)

| # | STRIDE | Threat | Mitigation required in the build |
|---|---|---|---|
| T-1 | Tampering | A modified client or a direct PostgREST call writes a `total_price` or `total` that doesn't match the lines (e.g. 0 kr on a 2,000 kr repair). | Not preventable without authN plus server-side computation (OQ-5, §5). v1: row-level CHECK constraints bound what's possible (SR-7). `total_price` is treated as non-authoritative until auth exists (SR-15). |
| T-2 | Tampering | Negative or out-of-range values: negative price, quantity ≤ 0, discount > gross, percent > 100, total < 0. Today nothing in the DB prevents a negative line. | DB CHECK constraints (SR-7), client validation at least as strict as the DB (SR-5, SR-14). |
| T-3 | Tampering | Inconsistent discount state, e.g. `discount_type = null, discount_value = 500`. The spec's `discount_type <> 'percent' or …` evaluates to NULL for a null type, so the constraint passes. | Consistency constraint (SR-7c), normalisation in `crud/` (SR-4). |
| T-4 | Tampering | Mass assignment: the form object (`Repair`, from react-hook-form) is spread into an insert/update. That lets a caller set `id`, `created_at`, `total`, or a future column. | Explicit column whitelist per write (SR-2). Caller totals ignored (SR-1). |
| T-5 | Tampering / DoS | Non-finite or huge numbers. `JSON.stringify(NaN/Infinity)` sends `null`. `price * 100 * bp` can exceed 2^53 and silently lose precision. `numeric(10,2)` overflows above 99,999,999.99. Postgres silently rounds `numeric(10,2)` input with >2 decimals, so the stored value can differ from the value the total was computed from. | Bounds and finiteness checks before write (SR-3). Values rounded to 2 dp before both calculation and write (SR-4). Strict parsing (SR-5). |
| T-6 | Tampering (integrity, non-malicious) | Non-atomic update: repair row updated, then items deleted, then items inserted. If the insert fails (network, or one of the new constraints), the repair keeps its new `total_price` and has **no lines**. The new constraints make this failure mode more likely than it is today. | Failure is surfaced and the form keeps its state, so a retry restores the lines (SR-12). Client validation matches the DB constraints, so constraint failures don't happen in normal use (SR-14). The atomic fix is a `save_repair` RPC, deferred with OQ-5 (§5). |
| T-7 | Tampering (migration) | The backfill overwrites all historic totals without a backup. A partial run (e.g. a type change fails after the first `update`) leaves mixed state. New constraints on existing rows may fail halfway. | One transaction, preflight checks, backup (SR-8, SR-9). New constraints on existing columns added `NOT VALID`, then validated (SR-7). |
| T-8 | Info disclosure | A backup table created in `public` during the migration gets RLS off by default and is exposed via PostgREST to the anon role. That leaks or allows tampering with historic data. | Backup goes in a non-exposed schema, or has RLS enabled with no policies (SR-9). |
| T-9 | Info disclosure | Raw `PostgrestError` (`message`, `details`, `hint`, constraint names, column names) rendered in the UI. `console.log(data)` in `app/createRepairModal.tsx:103,114` dumps the full repair, notes included. | Generic Danish error only (SR-11). Remove the payload `console.log`s from the modal being rewritten (SR-11). |
| T-10 | Spoofing / Elevation | No login flow. Requests run as `anon`, so for the app to work at all RLS must currently allow anon full CRUD, or be disabled. The new columns inherit that. Not widened by this feature, but not verified either: there's no schema in the repo. | No RLS change in this feature (per spec). Record the actual RLS state as gate evidence (SR-10). Tracked as pre-existing (§6). |
| T-11 | Repudiation | No record of who applied a discount or when. | Out of scope. It can't be attributed without authN. Revisit with auth (an audit column such as `updated_by`). No SR. |
| T-12 | Tampering (read path) | Unexpected DB values: an unknown `discount_type` string, a numeric returned as a string, null. These crash the screen or render `NaN`. | Defensive mapping (SR-6). |
| T-13 | XSS | Discount and total values rendered in the UI. | Low risk. Values are numbers rendered through RN `<Text>`, and there are no HTML sinks in `app/` or `components/` (`dangerouslySetInnerHTML` grep is empty). No SR beyond SR-5/SR-6. |

## 4. Security requirements

Each SR is testable. "No request is sent" is verified in the browser devtools Network tab, filtered to `/rest/v1/`.

**Calculation and write path (`crud/repairs.ts`, `lib/repairPricing.ts`)**

- **SR-1: Server payload totals come only from the calculator.** `createRepair` and `updateRepair` write `repairs.total_price` and each `repair_items.total` only from `calculateRepairTotals(repair.items, repair.discount)`. `repair.totalPrice` and `items[].total` from the caller never appear in a payload. *Test:* call `createRepair` with E1 lines plus `totalPrice: 999999` and `items[0].total: -5`. The DB has `total_price = 541.50` and line totals `270.00` / `300.00` (AC-13).
- **SR-2: Explicit column whitelist.** Write payloads are object literals that list columns explicitly. There is no `...repair`, `...item` or `...data` spread into `.insert()`/`.update()`. `repairs` update never sends `id` or `created_at`. `repair_items` inserts send exactly `repair_id, title, price, quantity, total, discount_type, discount_value`. *Test:* code review of `crud/repairs.ts`. Passing an object with an extra property (e.g. `{...repair, id: 1, foo: 1}` cast) doesn't change the request body (Network tab).
- **SR-3: Finite, bounded numbers before any request.** Before the first Supabase call, `crud/` (or the calculator, called by `crud/`) throws if any of these is non-finite, negative, or above `99999999.99`: `price`, `quantity`, `discount.value`, or a computed line or repair total. It also throws if `quantity <= 0`, or if any intermediate øre value or product (`toOre(price) * quantity`, `ore * bp`) is not `Number.isSafeInteger`. *Test:* `price: 1e300`, `price: NaN`, `quantity: Infinity` each throw, and no request is sent.
- **SR-4: Normalised, pre-rounded discount values.** Before both the calculation and the write: `discount.value` is rounded to 2 dp. A `null` discount or a value of `0` is written as `discount_type = null, discount_value = 0`. The `discount_value` written is exactly the value used in the calculation, so the DB's implicit `numeric(10,2)` rounding never changes it. *Test:* discount `{type:'percent', value:12.345}` from a direct `crud/` call. The stored value and total are consistent (either 12.35 and its total, or rejected). AC-12 covers the 0 case.
- **SR-5: Strict decimal parsing in the form.** Discount inputs accept only `^\d{1,8}([.,]\d{1,2})?$` after trim, with `,` normalised to `.`. `Number(...)` / `Number(t) || 0` coercion isn't used for discount fields. *Test:* `1e3`, `0x10`, `Infinity`, `-5`, `5..0`, `12,345` and `" "` each show a Danish error (`'Ugyldigt tal'` or the matching §5.2 message) and send no request. `12,5` → 12.5. (Price/quantity inputs at `components/ui/RepairLinesSection.tsx:89,104` use `Number(t) || 0`. That's pre-existing, and SR-3 bounds it at the `crud/` layer.)
- **SR-6: Defensive read mapping.** `mapRepairRow`/`mapItemRow` accept `discount_type` only if it is `'percent'` or `'amount'`. Any other value, including null, maps to `discount: null`. Numeric columns are converted with `Number()` and, if non-finite, mapped to `0`, so the UI never renders `NaN`. Typed `RepairRow`/`RepairItemRow` replace `any` (spec §5.3). *Test:* manually set `discount_type = 'bogus'` on a test row in the SQL editor. The bike screen renders without error and the line shows no discount. (The enum CHECK in SR-7a should make this impossible; the test is run with the constraint temporarily absent, or on a mapper unit test.)

**Database (migration.sql)**

- **SR-7: DB constraints bound every row the anon role can write.** In addition to the spec §6 constraints, the migration adds these named constraints (null-safe forms shown):
  - a. (spec) `discount_type in ('percent','amount')` on both tables. `discount_value >= 0` on both tables.
  - b. Percent max, written null-safe: `check (discount_type is distinct from 'percent' or discount_value <= 100)` on both tables.
  - c. Consistency on both tables: `check ((discount_type is null) = (discount_value = 0))`.
  - d. `repair_items`: `check (discount_type is distinct from 'amount' or discount_value <= round(price * quantity, 2))`.
  - e. `repair_items`: `check (total >= 0 and total <= round(price * quantity, 2))`.
  - f. `repair_items`: `check (price >= 0)` and `check (quantity > 0)`.
  - g. `repairs`: `check (total_price >= 0)`.

  Constraints on pre-existing columns (e, f, g) are added `NOT VALID` before the backfill, then `VALIDATE CONSTRAINT` after it. If validation fails, the transaction aborts (SR-8).

  *Test (SQL editor or `curl` with the anon key):* each of these is rejected with `23514`:
  - `discount_type=null, discount_value=5`
  - `discount_type='percent', discount_value=101`
  - an amount discount above the line gross
  - `total=-1`
  - `quantity=0`
  - `total_price=-1`
- **SR-8: Migration is atomic and has a preflight.** `migration.sql` is wrapped in `begin; … commit;`. It starts with a preflight `select` that shows the `data_type`/`numeric_scale` of `repairs.total_price`, `repair_items.price`, `repair_items.quantity` and `repair_items.total` (OQ-1), and `relrowsecurity` for both tables. Any `alter column … type numeric(10,2)` happens inside the same transaction before the backfill. *Test:* run the script against a copy where a constraint will fail (e.g. a row with `quantity = 0`). No column, constraint or value changes persist.
- **SR-9: Backup before backfill, not API-exposed.** Before the backfill `update`s, the migration copies `(id, total)` from `repair_items` and `(id, total_price)` from `repairs` into tables in a schema that PostgREST doesn't expose (e.g. `create schema if not exists private`). If the copies have to live in `public`, they get `enable row level security` and no policies. Rollback instructions include the restore statement and when to drop the backup. *Test:* with the anon key, `GET /rest/v1/<backup_table>` returns an error or `[]`, never rows.
- **SR-10: No auth/RLS/grant changes, and the state is recorded.** The migration contains no `create policy`, `alter policy`, `grant`, `revoke`, `disable row level security` or `security definer`. The preflight output from SR-8 (RLS on/off for `repairs`, `repair_items`), plus `select * from pg_policies where tablename in ('repairs','repair_items')`, is pasted into `status.md` as gate evidence. *Test:* grep `migration.sql` for those keywords → none. Evidence present in `status.md`.

**Errors and UI**

- **SR-11: No internals leak to the UI or console from the save path.** On a failed save the modal shows only `'Reparationen kunne ikke gemmes'` (AC-14). `PostgrestError.message/details/hint/code` aren't rendered. The `console.log(data)` calls in `app/createRepairModal.tsx` (currently lines 103 and 114) are removed in the rewrite. `console.error(error)` in the catch block is acceptable. *Test:* trigger a constraint violation (SR-7 test row via devtools request override, or temporarily block `repair_items`). The UI shows the generic text only.
- **SR-12: Failed save is recoverable.** `createRepair`/`updateRepair` throw on every Supabase error, including item delete and item insert. On a throw the modal stays open with all form values, including discounts, intact. A second "Opdater" with the same data produces the correct DB state from §3. *Test:* in devtools, block `POST /rest/v1/repair_items` and click "Opdater". The error shows and the DB repair has 0 lines. Unblock and click "Opdater" again. The lines, totals and `total_price` match §3.
- **SR-13: `createRepair` doesn't leave an orphan repair silently.** If the item insert fails after the repair insert, `createRepair` throws (current code does). On retry from the still-open modal the user doesn't silently create a second repair without lines. Either the created id is kept and the retry goes through the update path, or the orphan is deleted before throwing. *Test:* block `POST /rest/v1/repair_items` on "Opret", unblock and retry. Exactly one repair exists for the bike, with the correct lines.
- **SR-14: Client validation is a superset of the DB constraints.** `validateDiscount` and the form rules reject every input that SR-7 would reject, so a valid form never hits a constraint error. *Test:* boundary values save successfully: 100 %, amount = line gross, amount = subtotal, 0, E2 (99.99 × 3, 15 %). Values just past each boundary are blocked client-side with no request.

**Operational**

- **SR-15: `total_price` is not used as an authoritative financial figure in v1.** No feature built on this (invoice, payment, export) treats `repairs.total_price` as trusted until OQ-5 is revisited with auth. Document this in the spec §8 risk note. *Test:* documentation check at gate 2.

## 5. Position on OQ-5 (trigger vs. client-computed `total_price`)

**Agree with the recommended default (client-computed in `crud/` for v1), with conditions.**

Why a trigger buys little today: there's no authentication. Anyone holding the anon key, which ships in the web bundle, can already set any `price`, delete any repair, or read every customer, assuming the permissive RLS the app needs to function (T-10). A trigger that recomputes `total_price` stops a tampered *total*, but not tampered *inputs*, so it's no fraud control yet. It would also create a second implementation of the §3 rounding rules in PL/pgSQL. Divergence between the JS and SQL rounding then shows up as "UI total ≠ stored total", which violates the spec's single-source-of-truth rule and AC-10.

Conditions for accepting v1 without a trigger:
1. Row-local integrity is enforced in the DB (SR-7). Cross-row consistency (`total_price = Σ items.total − repair discount`) can't be a CHECK constraint, and is accepted as client-maintained.
2. SR-15 is documented.
3. When auth/RLS is designed, replace the three-call save with one `save_repair(repair jsonb)` Postgres function that computes totals server-side and writes repair plus items in one transaction. That fixes T-1 and T-6 together. Requirements for that function, recorded now so they aren't lost: `security invoker` (not `definer`), `set search_path = ''`, fully qualified table names, and `revoke execute … from anon` once an authenticated role exists. When this lands, the JS calculator becomes display-only.

## 6. Spec issues

### Spec blockers
None. Nothing in the spec is insecure by design for its stated scope: no new access, no new PII, no secrets.

### Required spec amendments before gate 1 (not blockers, but the build depends on them)
1. **§6 constraints are incomplete.** The percent constraint passes for `discount_type = null` (NULL in CHECK = pass), and nothing ties type and value together. Also missing: a DB bound for line amount ≤ gross, and non-negative `total`/`total_price`/`price` / positive `quantity`. Add SR-7 b–g to §6.
2. **§6 migration has no transaction, preflight or backup.** OQ-7 accepts overwriting, but a partial run or a failed type change must not leave mixed state. Add SR-8 and SR-9 to §6 and to the rollback note. Make sure any backup table isn't exposed to anon (T-8).
3. **§5.3 non-atomic update.** State the T-6 failure mode explicitly and adopt SR-12/SR-13 as acceptance criteria (they extend AC-14). The new constraints make "items deleted, insert rejected" reachable.
4. **§8:** add SR-15 (stored total is non-authoritative until auth exists).

### Pre-existing issues observed (outside this feature, for the backlog; not blocking)
- **RLS state unverified.** No login flow plus no schema in the repo means anon most likely has full CRUD on `customers` (PII), `bikes`, `repairs` and `repair_items`, or RLS is off. Once the web build is hosted, anyone who loads it has the key. SR-10 captures the evidence. Fixing it needs an auth/RLS design (user approval per CLAUDE.md).
- **`.env` is tracked in git** (`git ls-files .env` → `.env`, added in `be10041`). `.gitignore` only ignores `.env*.local`. The anon key is public by design, so this isn't a leak in itself. But a service-role key placed there later would be committed. I didn't verify the key's role (decoding it was blocked in this session). Confirm in the Supabase dashboard that `EXPO_PUBLIC_SUPABASE_KEY` is the anon/publishable key. Separately, consider untracking `.env` and committing a `.env.example`.
- **`deleteRepair` and `getRepair` swallow errors** (`crud/repairs.ts`). The spec puts this out of scope. No security impact beyond silent failure.

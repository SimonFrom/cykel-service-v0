# Spec: Repair discounts and persisted total price

- **Slug:** 19-repair-discounts
- **Status:** approved (Gate 1), revised
- **Contract version:** 2
- **Author:** spec-writer · **Approved by:** Simon From on 2026-10-20
- **Source:** GitHub issue #19 "Add feature to discount items"
- **Related:** `security-design.md` (SR-1 to SR-15), `ux.md`

## 1. Problem & goal
Workshop staff can't give a discount on a repair. They need three options: a discount on individual lines, a percentage off the repair total, or a flat amount off the repair total. Separately, `repairs.total_price` in the database is never correct. The app only shows a correct total because it recalculates it from the lines every time it reads. The goal: staff can set discounts in the repair modal and see the subtotal, discount and final total live. Every save writes the correct line totals and final total to the database, and that stored final total is what the app shows.

### Root cause: why `total_price` is not persisted
1. **The form never sets `totalPrice`.** `app/createRepairModal.tsx` builds the `useForm<Repair>` `defaultValues` and the `reset()` call without a `totalPrice` field. `RepairLinesSection` calculates `grandTotal` for display only and never writes it back to the form. As a result, `onSubmit` passes `data.totalPrice === undefined` to `createRepair`/`updateRepair`.
2. **supabase-js drops `undefined` keys.** The payload `{ total_price: undefined, ... }` goes through `JSON.stringify`, which removes the key. On insert the column gets its DB default (null/0). On update the column isn't touched, so it keeps the stale value.
3. **Line totals go stale on update.** New lines are appended with `total: 0`, and `total` is never recalculated while editing. `createRepair` hides this by writing `price * quantity`. `updateRepair` writes `item.total` as it is. After an edit, `repair_items.total` is 0 for new lines and stale for lines whose price or quantity changed.
4. **The read path hides the bug.** `mapRepairRow` in `crud/repairs.ts` ignores `row.total_price` and returns `sum(items.total)`. After an edit this is also wrong (see 3). For example, the bike screen shows "Total pris: 0 kr" for a line added during an edit.
5. **Failures are silent.** `updateRepair` returns errors instead of throwing them. The modal closes in `finally` whether the save worked or not.

## 2. Users & permissions
| Role | Can do |
|---|---|
| Workshop staff (any app user) | Set or remove line and repair discounts when creating or editing a repair. View totals. |

No new roles. There's no login flow, so access is whatever the existing RLS on `repairs`/`repair_items` allows. This feature doesn't change auth, RLS, policies or grants.

## 3. Price calculation (normative)
`lib/repairPricing.ts` is the single source of truth. The form display and `crud/` both use it. Nothing else may calculate totals.

**Units.** Amounts are DKK with 2 decimals. All arithmetic is done in integer øre so floating-point drift can't creep in.
- `toOre(x) = Math.round(x * 100)`; `fromOre(o) = o / 100`.
- `bp(pct) = Math.round(pct * 100)` (percent as basis points; 12.5 % → 1250).
- **Rounding:** round half up on non-negative integers: `pctOf(ore, bp) = Math.floor((ore * bp + 5000) / 10000)`.

**Per line** (`price`, `quantity`, `discount`):
1. `grossOre = Math.round(toOre(price) * quantity)`
2. `lineDiscountOre` =
   - `discount == null` → `0`
   - `type 'percent'` → `pctOf(grossOre, bp(value))`
   - `type 'amount'` → `min(toOre(value), grossOre)`. The amount applies to the **line total**, not per unit (decided, OQ-3).
3. `netOre = grossOre - lineDiscountOre` (always ≥ 0). `RepairItem.total = fromOre(netOre)`.

**Per repair:**
1. `subtotalOre = Σ netOre`. Line discounts are always applied **before** the repair discount.
2. `repairDiscountOre` =
   - `null` → `0`
   - `'percent'` → `pctOf(subtotalOre, bp(value))`
   - `'amount'` → `min(toOre(value), subtotalOre)`
3. `totalOre = subtotalOre - repairDiscountOre` (always ≥ 0). `Repair.totalPrice = fromOre(totalOre)`.

**Combining (decided, OQ-2).** Every line can have its own discount, and the repair can have one discount on top. At repair level the discount is **either** a percentage **or** a flat amount, never both.

**Bounds / validation (decided, OQ-4).** The form enforces these and blocks submit. The calculator also clamps them defensively.
- `value` is a finite number ≥ 0 with at most 2 decimals.
- `percent`: 0 ≤ value ≤ 100.
- `amount` (line): value ≤ line gross. `amount` (repair): value ≤ subtotal.
- A discount with `value === 0` is normalised to `null`.
- Totals are never negative.
- Client validation must reject everything the DB constraints in §6 reject (SR-14), so a valid form never hits a constraint error.

**Worked examples** (QA fixtures):
| # | Lines (price × qty, line discount) | Repair discount | Subtotal | Total |
|---|---|---|---|---|
| E1 | 150 × 2, 10 % → 270.00; 350 × 1, 50 kr → 300.00 | 5 % (28.50) | 570.00 | 541.50 |
| E2 | 99.99 × 3 = 299.97, 15 % (44.9955 → 45.00) → 254.97 | none | 254.97 | 254.97 |
| E3 | 200 × 1, none | 200 kr | 200.00 | 0.00 |
| E4 | 120 × 1, 100 % → 0.00; 330 × 1, none | 12.5 % (41.25) | 330.00 | 288.75 |
| E5 | 100 × 1, none; 33.33 × 1, none | 33.33 % (44.4389 → 44.44) | 133.33 | 88.89 |
| E6 | no lines | 10 % | 0.00 | 0.00 |

## 4. Acceptance criteria
- **AC-1:** Given the repair modal with a line of price 150 and quantity 2, when the user sets the line discount to 10 %, then that line's "Total kr" shows 270.00 (2 decimals) and the subtotal shows 270.00.
- **AC-2:** Given a line of price 350 and quantity 1, when the user sets the line discount to 50 kr, then the line total shows 300.00.
- **AC-3:** Given subtotal 570.00, when the user sets the repair discount to 5 %, then the modal shows "Subtotal 570.00", "Rabat −28.50" and "I alt 541.50".
- **AC-4:** Given subtotal 570.00, when the user sets the repair discount to 100 kr, then "I alt" shows 470.00.
- **AC-5:** Given a repair discount type, when the user changes it from % to kr (or the reverse), then only one repair discount is active and the total is recalculated with the new type and current value. Percentage and flat can't both be active at once.
- **AC-6:** Given any discount field, when the user enters a percentage > 100, a negative value, a flat amount larger than its base (line gross or subtotal), or a non-numeric value, then a Danish error appears under the field, the "Opret"/"Opdater" button submits nothing, and no request is sent.
- **AC-7:** Given the inputs from table §3 E1–E6, when `calculateRepairTotals` runs, then it returns exactly the listed subtotal and total for each row. Each line `total` matches as well. Automated as jest unit tests in `Test/Claude/`, run with `npm test`.
- **AC-8:** Given a new repair with lines and discounts (E1), when the user clicks "Opret", then the DB contains `repairs.total_price = 541.50`, `repairs.discount_type = 'percent'`, `repairs.discount_value = 5`, plus `repair_items` rows with `total` 270.00 and 300.00 and their `discount_type`/`discount_value`.
- **AC-9:** Given an existing repair, when the user adds a line, changes a quantity or price, or removes a discount and clicks "Opdater", then `repairs.total_price` and every `repair_items.total` in the DB match the calculation in §3 for the saved state. No line has a stale or 0 total unless its net really is 0.
- **AC-10:** Given a saved repair, when it is shown on the bike screen ("Total pris") and the front-page recent repair card ("Pris"), then the value shown equals `repairs.total_price` from the DB.
- **AC-11:** Given a repair saved with discounts, when the modal is reopened for it, then every line discount and the repair discount are pre-filled with their saved type and value, and the totals match the saved `total_price`.
- **AC-12:** Given a discount value of 0 (or a cleared field), when the repair is saved, then the DB stores `discount_type = null` and `discount_value = 0` for that line or repair.
- **AC-13:** Given `crud/` gets a `Repair` whose `totalPrice` or `items[].total` disagrees with its lines and discounts, when `createRepair`/`updateRepair` runs, then the persisted values are the ones `calculateRepairTotals` produces. The values from the caller are ignored.
- **AC-14:** Given the Supabase update or insert fails (for example a check constraint violation), when the user clicks "Opret"/"Opdater", then the modal stays open, a Danish error "Reparationen kunne ikke gemmes" is shown (no raw Supabase message), and `updateRepair`/`createRepair` throw instead of returning the error.
- **AC-15:** Given existing repairs created before this feature, when the migration runs, then every `repair_items.total = round(price * quantity, 2)` and every `repairs.total_price = sum(repair_items.total)` (0 if no lines). Discounts are null/0.
- **AC-16 (SR-12):** Given an existing repair being edited and `POST /rest/v1/repair_items` blocked in devtools, when the user clicks "Opdater", then the save error is shown, the modal stays open, and every form value (lines, prices, quantities, line and repair discounts) is unchanged. When the block is removed and the user clicks "Opdater" again, the DB lines, line totals and `total_price` match §3.
- **AC-17 (SR-13):** Given a new repair and `POST /rest/v1/repair_items` blocked, when the user clicks "Opret", then the save error is shown and no repair row is left for that attempt. When the block is removed and the user clicks "Opret" again, exactly one new repair exists for the bike, with the correct lines and totals.
- **AC-18 (B-1):** Given a repair with a repair-level discount, when the user removes all lines, then the discount is kept in form state and the footer stays visible with "Subtotal 0.00". A flat discount > 0 then shows "Rabat kan ikke overstige beløbet" and blocks submit until fixed; a percent discount shows "I alt 0.00" (E6). The footer is hidden only when there are no lines and no repair discount.
- **AC-19:** Given the modal, when it is opened for a new repair (`repair.id === 0`), then the submit button says "Opret". When it is opened for a saved repair (`repair.id !== 0`), including one with zero lines, it says "Opdater".
- **AC-20 (B-3):** Given the web modal at a 375 × 600 CSS px viewport with 5 lines and a repair discount error showing, when the user scrolls the modal, then the footer (Subtotal / Rabat / I alt), every error text and the submit button can be reached by vertical scrolling only. At 320 CSS px width there is no horizontal scroll.
- **AC-21 (B-4):** Given any error text added or touched by this feature (discount errors, save error), when its colour is measured against its background, then the contrast ratio is ≥ 4.5:1 (WCAG 2.2 1.4.3).
- **AC-22 (SR-7):** Given the migration has run, when a row is written via the SQL editor or the anon key with any of `discount_type = null, discount_value = 5`; `discount_type = 'percent', discount_value = 101`; an `'amount'` line discount above `round(price * quantity, 2)`; `total = -1`; `total` above line gross; `price = -1`; `quantity = 0`; or `total_price = -1`, then the write is rejected with SQLSTATE `23514`.
- **AC-23 (SR-8):** Given `migration.sql`, when it runs against a DB where any of `repairs.total_price`, `repair_items.price`, `repair_items.total` is not `numeric`, or where an existing row violates a new constraint (e.g. `quantity = 0`), then the script raises an exception and no column, constraint, backup or value change persists.
- **AC-24 (SR-9):** Given the migration has run, when `GET /rest/v1/<backup table name>` is called with the anon key, then it returns an error or `[]`, never rows.

## 5. API / data contract
There's no HTTP API. The contract is the domain types, the pure calculator and the `crud/` functions. Auth: Supabase anon client and the existing RLS, unchanged.

### 5.1 Domain types (`types/`)
```ts
// types/discount.ts (new)
export type DiscountType = 'percent' | 'amount';
export type Discount = {
  type: DiscountType;
  value: number; // >= 0, max 2 decimals; percent: <= 100
};

// types/repairItems.ts (changed)
export type RepairItem = {
  id: number;
  price: number;            // DKK per unit, >= 0
  title: string;
  quantity: number;         // > 0
  discount: Discount | null; // NEW
  total: number;            // DERIVED: net line total after line discount (was price*qty)
};

// types/repair.ts (changed)
export type Repair = {
  // ...existing fields unchanged...
  discount: Discount | null; // NEW: repair-level discount, applied after line discounts
  totalPrice: number;        // DERIVED: final total after all discounts; read from repairs.total_price
};
```

### 5.2 Calculator (`lib/repairPricing.ts`, new, pure, no I/O)
```ts
export type LineTotals = { gross: number; discount: number; net: number };
export type RepairTotals = {
  lines: LineTotals[];     // same order as input items
  subtotal: number;        // sum of line nets
  repairDiscount: number;  // amount deducted at repair level
  total: number;           // subtotal - repairDiscount, >= 0
};

export function calculateLineTotals(
  item: Pick<RepairItem, 'price' | 'quantity' | 'discount'>
): LineTotals;

export function calculateRepairTotals(
  items: Pick<RepairItem, 'price' | 'quantity' | 'discount'>[],
  discount: Discount | null
): RepairTotals;

// Returns a Danish error message or null. `base` = line gross or subtotal (DKK).
export function validateDiscount(discount: Discount | null, base: number): string | null;
```
All returned amounts are DKK numbers rounded to 2 decimals (`fromOre`). Error messages for `validateDiscount`:
- `'Rabat skal være 0 eller mere'`
- `'Procent skal være mellem 0 og 100'`
- `'Rabat kan ikke overstige beløbet'`
- `'Ugyldigt tal'`

The calculator throws (not clamps) on non-finite or out-of-range inputs: `price`, `quantity`, `discount.value` or any computed total that is non-finite, negative or above `99999999.99`; `quantity <= 0`; or an intermediate øre product that is not `Number.isSafeInteger` (SR-3). Discount values are rounded to 2 dp before use (SR-4).

### 5.3 `crud/repairs.ts` (changed signatures in bold)
```ts
getRepairs(bikeId: number): Promise<Repair[]>      // unchanged signature
getAllRepairs(): Promise<Repair[]>                 // unchanged signature
getRepair(id: number): Promise<Repair | null>      // unchanged (error handling out of scope)
createRepair(repair: Omit<Repair, 'id'>): Promise<number>  // unchanged signature
updateRepair(id: number, repair: Repair): Promise<void>    // CHANGED: was implicit Promise<PostgrestError | undefined>; now throws
deleteRepair(id: number)                           // unchanged
```
Behaviour changes:
- **Write (create/update):** call `calculateRepairTotals(repair.items, repair.discount)` and write `total_price`, `discount_type`, `discount_value` on `repairs`. Write each item's `total` from `lines[i].net`, plus `discount_type` and `discount_value`. Normalise `value 0 → type null, value 0`. Ignore the caller's `totalPrice`/`items[].total` (SR-1). The calculator runs before the first Supabase call, so a throw from it sends no request (SR-3).
- **Explicit column whitelist (SR-2):** payloads are object literals, no spreads of `repair`/`item`/form data. `repairs` writes never send `id` or `created_at`. `repair_items` inserts send exactly `repair_id, title, price, quantity, total, discount_type, discount_value`.
- **Errors:** `createRepair` and `updateRepair` throw every Supabase error (repair insert/update, item delete, item insert). They no longer `console.error` and return them.
- **Partial-save failure (non-atomic save, T-6).** A save is three requests and is not transactional:
  - `updateRepair`: (1) update `repairs` row, (2) delete all its `repair_items`, (3) insert the new items. If (3) fails, the DB is left with the new `total_price` and **zero lines**. This is accepted for v1. Recovery: the error is thrown, the modal stays open with all form state intact, and a retry of "Opdater" rewrites the full state (AC-16). Client validation matching the DB constraints (SR-14) keeps constraint failures out of normal use.
  - `createRepair`: (1) insert `repairs`, (2) insert items. If (2) fails, `createRepair` deletes the repair row it just created (best effort), then rethrows the original error. So a retry of "Opret" creates exactly one repair (AC-17). If the compensating delete also fails, the original error is still thrown and the orphan (a repair with no lines) remains. That's accepted for v1.
  - The atomic fix (a `save_repair` Postgres function) is deferred with OQ-5.
- **Read mapping (SR-6):** `mapRepairRow.totalPrice = Number(row.total_price ?? 0)`. Stop calculating it from items. `discount` = `{ type, value: Number(row.discount_value) }` only when `row.discount_type` is `'percent'` or `'amount'`; any other value, including null, maps to `null`. `mapItemRow` maps the same discount fields and `total = Number(row.total)`. Every numeric field that is non-finite after `Number()` maps to `0`.
- Replace the `any` row mappers with typed row types (`RepairRow`, `RepairItemRow`) declared in `crud/repairs.ts`.

### 5.4 Store (`store/repairStore.ts`)
No new actions. `Repair` gains `discount`. The existing refetch-on-focus on the bike screen and front page covers AC-10.

## 6. Data model changes
> **SCHEMA CHANGE: approved by the user on 2026-10-20.** There are no migrations in the repo. The SQL is delivered as `docs/features/19-repair-discounts/migration.sql`, and the user runs it in the Supabase SQL editor. No RLS, policy, grant or auth changes.

Column types (decided, OQ-1): `repairs.total_price`, `repair_items.price` and `repair_items.total` are already `numeric`. No type conversion. The preflight verifies this and aborts if not.

**`migration.sql` must do the following, in this order, inside one `begin; … commit;` (SR-8):**
1. **Preflight.**
   - Output `data_type`/`numeric_precision`/`numeric_scale` from `information_schema.columns` for `repairs.total_price`, `repair_items.price`, `repair_items.quantity`, `repair_items.total`.
   - Output `relrowsecurity` from `pg_class` for `repairs` and `repair_items`, plus `select * from pg_policies where tablename in ('repairs','repair_items')`.
   - A `do $$ … $$` block that `raise exception`s if any of `total_price`, `price`, `total` is not `numeric`.
   - Output the count of existing `repair_items` rows with `price < 0` or `quantity <= 0`. These are the only rows that can fail step 7, because the backfill makes `total` and `total_price` valid. That way the user sees why a validation would fail.
2. **Backup (SR-9).** `create schema if not exists private`. Copy `(id, total)` from `repair_items` into `private.repair_items_total_backup_19` and `(id, total_price)` from `repairs` into `private.repairs_total_price_backup_19`. `private` isn't exposed by PostgREST. If the user's project exposes `private`, the tables get `enable row level security` and no policies.
3. **New columns** (both tables):
   ```sql
   discount_type  text          null
   discount_value numeric(10,2) not null default 0
   ```
4. **Constraints on new columns** (both tables, added valid; all existing rows are null/0). `<t>` is `repairs` or `repair_items`:
   | Name | Check |
   |---|---|
   | `<t>_discount_type_chk` | `discount_type in ('percent','amount')` |
   | `<t>_discount_value_nonneg_chk` | `discount_value >= 0` |
   | `<t>_discount_pct_max_chk` | `discount_type is distinct from 'percent' or discount_value <= 100` (null-safe) |
   | `<t>_discount_consistency_chk` | `(discount_type is null) = (discount_value = 0)` |
   | `repair_items_discount_amount_max_chk` | `discount_type is distinct from 'amount' or discount_value <= round(price * quantity, 2)` |
5. **Constraints on pre-existing columns**, added `NOT VALID`:
   | Name | Check |
   |---|---|
   | `repair_items_total_bounds_chk` | `total >= 0 and total <= round(price * quantity, 2)` |
   | `repair_items_price_nonneg_chk` | `price >= 0` |
   | `repair_items_quantity_pos_chk` | `quantity > 0` |
   | `repairs_total_price_nonneg_chk` | `total_price >= 0` |
6. **Backfill (AC-15, decided OQ-7: may overwrite).** No discounts existed, so net = gross:
   - `update repair_items set total = round(price * quantity, 2)`
   - `update repairs r set total_price = coalesce((select sum(i.total) from repair_items i where i.repair_id = r.id), 0)`
7. **`alter table … validate constraint`** for each constraint in step 5. A failure aborts the whole transaction (AC-23).
8. `commit`.

**Forbidden in `migration.sql` (SR-10):** `create policy`, `alter policy`, `grant`, `revoke`, `disable row level security`, `security definer`. No new indexes.

**Gate evidence (SR-10):** the user pastes the preflight output (column types, RLS on/off, `pg_policies`) into `docs/features/19-repair-discounts/status.md`.

**Rollback** (shipped as a commented block at the end of `migration.sql`, run in one transaction):
1. Restore totals from the backup:
   - `update repair_items i set total = b.total from private.repair_items_total_backup_19 b where b.id = i.id`
   - The same for `repairs.total_price`.
2. Drop the nine constraints from steps 4–5.
3. Drop the four new columns.
4. Drop the backup tables only after the user has verified the feature at Gate 2 and no longer needs the old totals. Until then they stay.

A failed run needs no rollback, because the transaction leaves nothing behind.

## 7. Non-functional requirements
- Totals recalculate synchronously on every keystroke in the modal. With 50 lines, the UI updates in < 16 ms (one frame) on web.
- Save stays at the current request count: 1 repair write + 1 item delete + 1 item insert (create: 1 + 1, plus the compensating delete only on failure). No extra queries.
- UI text is Danish. Line totals, subtotal, discount and "I alt" are shown with 2 decimals (`toFixed(2)`). The line total's current `toFixed(0)` is replaced (B-2). No Danish thousands formatting (decided, OQ-6).
- Discount inputs keep the raw typed text locally. They accept only `^\d{1,8}([.,]\d{1,2})?$` after trim, with `,` normalised to `.` (`"12,5"` → 12.5). Empty means no discount. Anything else is `'Ugyldigt tal'` and the raw text is kept. `Number(t) || 0` isn't used for discount fields (SR-5).
- The save path renders no Supabase internals (`message`/`details`/`hint`/`code`). The `console.log(data)` calls in `app/createRepairModal.tsx` are removed. `console.error(error)` in the catch is allowed (SR-11).
- The modal card scrolls vertically (`ScrollView`, max height 90vh). Below 768 px width the body stacks vertically and the submit button comes after the lines section (B-3, AC-20).
- New and touched error text uses a colour with ≥ 4.5:1 contrast: theme `text-destructive` if it passes, otherwise `#C62828` (B-4, AC-21).
- The submit button shows `Gemmer…` and is disabled while a save is in flight, so a double click can't create two repairs.
- Web first (evergreen browsers). Inputs and type selectors have accessible names (`aria-label`/`aria-labelledby`), and invalid fields set `aria-invalid` and `aria-describedby`, per WCAG 2.2 AA. Layout, copy and a11y details follow `ux.md`.

## 8. Data sensitivity
- Touches `repairs` and `repair_items`: prices, discounts and totals. These are commercial data, not PII. No customer fields change.
- Risk: there's no auth flow and access relies on RLS. Anyone with the anon key can change discounts or totals, just as they can change prices today. This feature doesn't add or widen access.
- Integrity: the stored `total_price` is calculated on the client (in `crud/`), so a modified client or a direct PostgREST call could store a total that doesn't match its lines. The §6 constraints bound each row (no negative amounts, discounts within range, line total ≤ gross), but cross-row consistency (`total_price` = lines − repair discount) can't be a CHECK constraint and is client-maintained. A DB-side recalculation is out of scope (decided, OQ-5).
- **`total_price` is not authoritative in v1 (SR-15).** No feature built on this (invoice, payment, export, reporting) may treat `repairs.total_price` as a trusted financial figure until server-side calculation (`save_repair` RPC, security-design §5) and auth exist. Until then, the trusted value is the one recomputed from the lines.
- The backup tables in `private` hold historic totals only (no PII) and aren't reachable by the anon role (SR-9).

## 9. Work breakdown
- [shared] `types/discount.ts`. Add `discount` to `RepairItem` and `Repair`, and document `total`/`totalPrice` as derived fields.
- [shared] `lib/repairPricing.ts`: `calculateLineTotals`, `calculateRepairTotals`, `validateDiscount`, implemented exactly as in §3 and §5.2 (including the SR-3 throws).
- [shared] Test setup (approved): add `jest` and `jest-expo` as devDependencies, a jest config with preset `jest-expo` limited to `Test/Claude/`, and an `npm test` script.
- [backend] `docs/features/19-repair-discounts/migration.sql`, exactly as in §6, with the rollback block. The user runs it before anyone tests against the DB.
- [backend] `crud/repairs.ts`: typed row mappers, defensive read mapping, read `total_price` and discount columns, calculate and write totals on create/update, explicit column whitelist, make `updateRepair` throw, and add the compensating delete in `createRepair` (§5.3).
- [frontend] `components/ui/DiscountInput.tsx` (new): value input plus a `%`/`kr` two-button toggle wrapping stock `Button`, with a raw-text buffer and strict parsing (§7, `ux.md` §2/§5). Don't edit stock components.
- [frontend] `components/ui/RepairLinesSection.tsx`:
  - Add a "Rabat" column per line (`DiscountInput`).
  - Show the 2-decimal line total from `calculateLineTotals`.
  - Footer rows: "Subtotal", the repair "Rabat" (`DiscountInput`, amount shown as `−x.xx`), and "I alt".
  - Footer visibility as in AC-18.
  - New lines are appended with `discount: null`.
  - Narrow layout below 768 px as in `ux.md` §3.3.
- [frontend] `app/createRepairModal.tsx`:
  - Add `discount` to `defaultValues` and `reset()`.
  - Validate discounts with `validateDiscount` via react-hook-form `rules`, and revalidate when the base changes.
  - Move `reset`/`router.back()` out of `finally`, so the modal only closes after a successful save. Show the Danish save error (AC-14, AC-16, AC-17).
  - Submit label based on `repair.id !== 0` (AC-19), plus the `Gemmer…` saving state.
  - Scroll container and narrow stacking (AC-20).
  - Compliant error colour (AC-21).
  - Remove the `console.log(data)` calls.
- [frontend] Note only: `app/createRepairModal.ios.tsx` gets line discounts through the shared `RepairLinesSection`, but not the repair-level discount field or the error handling. Leave it unchanged unless asked. `components/ui/createRepairForm.tsx` is unused, so don't touch it.
- [qa] `Test/Claude/`: jest unit tests for the calculator covering AC-7 (E1–E6), the `validateDiscount` messages and boundaries (SR-14: 100 %, amount = gross, amount = subtotal, 0), and the SR-3 throws. The other ACs are checked manually on web: Network tab for "no request sent", devtools request blocking for AC-16/AC-17, and the SQL editor or `curl` for AC-22–AC-24.

## 10. Out of scope
- A catalogue of predefined discounts, discount reasons or codes, or customer-level discounts.
- Combining a percentage and a flat discount at repair level at the same time.
- Per-unit flat line discounts (the flat amount is per line).
- VAT/moms breakdown, receipts/invoices, Danish number formatting, currency formatting beyond 2 decimals.
- DB-side total calculation (triggers, generated columns, a `save_repair` RPC) and an atomic save.
- Any auth, RLS, policy or grant change.
- Audit of who applied a discount.
- Fixing `getRepair`/`deleteRepair` error swallowing, the `customerContacted` column naming, the bike screen's duplicated `useFocusEffect`, or the `Number(t) || 0` parsing on the existing price/quantity inputs (bounded by SR-3 in `crud/`).
- iOS/Android parity for the new modal fields.

## 11. Open questions
All resolved at Gate 1 (2026-10-20).

| # | Question | Decision |
|---|---|---|
| OQ-1 | What are the current column types of `repairs.total_price`, `repair_items.price` and `repair_items.total`? | **Decided:** already `numeric`/decimal (user). No conversion. The preflight raises an exception if they aren't. |
| OQ-2 | Can a repair have both a percentage and a flat discount at the same time? | **Decided:** no. One repair-level discount, either `%` or `kr`. Line discounts combine with it. |
| OQ-3 | Is a flat line discount per line or per unit? | **Decided (default):** per line total. |
| OQ-4 | Is a flat amount larger than its base blocked or clamped? | **Decided (default):** blocked in the form with an error. The calculator clamps as a safety net. |
| OQ-5 | Should the DB recalculate `total_price` (trigger)? | **Decided (default):** no trigger in v1. Calculate in `crud/`. Revisit with auth via a `save_repair` RPC (security-design §5). |
| OQ-6 | Danish number formatting (`1.234,50 kr`) for totals? | **Decided (default):** no. Keep the plain 2-decimal display. Separate issue. |
| OQ-7 | Is it OK to run a backfill that overwrites existing totals? | **Decided (default):** yes, with the backup in §6 step 2. |
| OQ-8 | Should the bill show the discount? | **Decided (default):** line total shows net, and the footer shows Subtotal / Rabat / I alt. No gross column. `ux.md` adds a muted `−x.xx` line-discount hint under the line total. |

## Changelog
- v1 — initial
- v2 — revised after Gate 1 (see below)

## Changes after review
- **Approval recorded:** schema change and test framework (jest + jest-expo, `npm test`, `Test/Claude/`) approved. Status set to approved, contract version 2.
- **OQs:** all eight are marked decided. OQ-1: columns are already numeric, no conversion, and the preflight aborts if not. OQ-2: one repair-level discount, % or kr.
- **§6 rewritten** (security amendments 1–2):
  - Migration runs in one transaction with a preflight (column types, RLS state, policies, raise on non-numeric) (SR-8).
  - Backup of the old totals goes into the non-exposed `private` schema (SR-9).
  - Null-safe percent check, type/value consistency, line amount ≤ gross, `total` bounds, `price ≥ 0`, `quantity > 0`, `total_price ≥ 0`. Checks on existing columns are added `NOT VALID` and validated after the backfill (SR-7).
  - Forbidden-keyword list and gate evidence added (SR-10).
  - The rollback restores from the backup.
- **§5.2 / §5.3** (security amendment 3):
  - The calculator throws on non-finite or out-of-range input (SR-3) and rounds discount values (SR-4).
  - crud uses an explicit column whitelist (SR-2) and defensive read mapping (SR-6), and `createRepair` also throws.
  - The partial-save failure is described. `createRepair` deletes its orphan repair on item-insert failure.
- **§7:** strict discount parsing (SR-5), no internals in the UI and removed `console.log`s (SR-11), 2-decimal line totals (B-2), scroll container (B-3), AA error colour (B-4), `Gemmer…` state.
- **§8:** added SR-15 (`total_price` isn't authoritative in v1) and the backup data note (security amendment 4).
- **New ACs** (AC-1 to AC-15 unchanged, apart from AC-1 stating 2 decimals, AC-7 naming the jest tests and AC-14 forbidding raw errors):
  - AC-16 (SR-12): failed update is recoverable.
  - AC-17 (SR-13): no orphan repair on failed create.
  - AC-18 (B-1): repair discount kept and footer shown when all lines are removed.
  - AC-19: submit label based on `repair.id !== 0`.
  - AC-20 (B-3): modal scrolls.
  - AC-21 (B-4): error contrast ≥ 4.5:1.
  - AC-22 (SR-7): DB constraints reject invalid rows.
  - AC-23 (SR-8): migration is atomic and the preflight aborts.
  - AC-24 (SR-9): backup isn't readable by anon.
- **§9:** added the test-setup item and a `DiscountInput` component, and extended the crud/modal items. QA now covers the validator and SR-3 unit tests.
- **§10:** Danish number formatting, the atomic save/RPC, auth/RLS changes, audit and price/quantity input parsing are now explicitly out of scope.

# Manual verification checklist: 19-repair-discounts (web)

Setup: `npm run web`, browser devtools open (Network tab). Run `migration.sql` first (for AC-8 onward). Use a test customer and bike. "DB" = Supabase table editor or SQL editor. Record pass/fail per step.

Fixture E1: line A "Bremsekabel" 150 x 2, line discount 10 %; line B "Service" 350 x 1, line discount 50 kr; repair discount 5 %.

## AC-1 / AC-2 / AC-3 / AC-4 (live numbers, UI half)
1. Open "Opret reparation". Add line 150 x 2, set line discount `%` = 10. Expect line total `270.00` and Subtotal `270.00`.
2. Add line 350 x 1, line discount `kr` = 50. Expect line total `300.00`; Subtotal `570.00`.
3. Set repair discount `%` = 5. Expect "Subtotal 570.00", "Rabat −28.50", "I alt 541.50".
4. Switch repair discount to `kr` and enter 100. Expect "I alt 470.00".

## AC-5 one repair discount at a time
1. With repair discount `%` = 5, click the `kr` toggle. Expect only one discount active (toggle shows `kr`), total recalculated using value 5 as kr (I alt 565.00).
2. Click `%` again: value 5 as percent, I alt 541.50. There is never a second discount field.

## AC-6 invalid input blocked (Network tab open, filter `repairs`)
For each: line discount `%` 101; `%` -5; line `kr` above line gross (e.g. 301 on the 300 gross line... use gross); repair `kr` above subtotal; text `abc`; `1e3`; `0x10`; `12,345`; `5..0`; `-5`.
Expect: Danish error under the field (`Procent skal være mellem 0 og 100`, `Rabat skal være 0 eller mere`, `Rabat kan ikke overstige beløbet` or `Ugyldigt tal`), red text, field marked invalid. Click "Opret": nothing is submitted, Network tab shows no new request, modal stays open.
Also: `12,5` is accepted as 12.5; empty field means no discount.

## AC-8 create persists totals
1. Build E1, click "Opret". Modal closes.
2. DB: `repairs` row has `total_price = 541.50`, `discount_type = 'percent'`, `discount_value = 5`.
3. `repair_items` rows: totals `270.00` and `300.00`; `(percent, 10)` and `(amount, 50)`.

## AC-9 edit persists totals
1. Open the E1 repair. Add a line 40 x 3 (no discount), change line A quantity to 3, remove line B's discount. Click "Opdater".
2. DB: every `repair_items.total` equals price x quantity minus discount (A: 450 - 10 % = 405.00; B: 350.00; C: 120.00); `total_price` = subtotal 875.00 minus 5 % (43.75) = 831.25. No line has total 0.

## AC-10 displayed total equals DB
1. Bike screen: "Total pris" for the repair equals `repairs.total_price`.
2. Front page recent repair card: "Pris" equals the same value.
3. In the DB manually change `total_price` to 123.00 and refocus the screen: UI shows 123 (proves it reads the column, not the lines). Restore afterwards.

## AC-11 pre-fill
Reopen the saved E1 repair. Expect line discounts `10 %` and `50 kr`, repair discount `5 %`, I alt matches saved `total_price`.

## AC-12 zero discount
1. Set a line discount to 0 (and separately clear it), set the repair discount to 0, save.
2. DB: `discount_type` is NULL and `discount_value` is 0 on that line and on the repair.

## AC-14 save failure message
1. Force a DB error, e.g. temporarily set the Network request blocking for `repairs` PATCH/POST, or violate a constraint through devtools override.
2. Click "Opret"/"Opdater". Expect modal stays open, the text `Reparationen kunne ikke gemmes`, no raw Supabase message, code or constraint name anywhere on screen. Console may show the error (allowed).

## AC-16 failed update is recoverable
1. Open an existing repair with lines and discounts. Devtools: block request URL pattern `*/rest/v1/repair_items*` (POST).
2. Click "Opdater". Expect save error shown, modal open, all lines, prices, quantities and discounts unchanged.
3. Remove the block, click "Opdater". DB lines, line totals and `total_price` match the calculation.

## AC-17 failed create leaves no orphan
1. New repair on a bike, block `POST */rest/v1/repair_items*`.
2. Click "Opret". Expect save error, modal open, no new repair row in DB for this attempt (check `repairs` for the bike).
3. Remove block, click "Opret" again. Exactly one new repair for the bike with correct lines and totals.

## AC-18 all lines removed
1. Edit a repair with repair discount `kr` 100 and lines. Remove all lines.
2. Expect footer still visible, "Subtotal 0.00"; error `Rabat kan ikke overstige beløbet`; "Opdater" submits nothing.
3. Switch to `%` 10: "I alt 0.00", submit allowed.
4. Clear the repair discount with no lines: footer hidden.

## AC-19 submit label
New repair modal: button "Opret". Open a saved repair (also one with zero lines): button "Opdater". While saving: `Gemmer…`, disabled (double click creates only one repair).

## AC-20 scrolling/layout
Devtools responsive mode 375 x 600. Create 5 lines and trigger a repair discount error. Scroll the modal: footer rows, every error text and the submit button are reachable by vertical scroll. At 320 px width: no horizontal scrollbar.

## AC-21 contrast
Inspect the error text colour (discount errors, save error) in devtools contrast checker. Expect ratio >= 4.5:1 against its background.

## AC-22 DB constraints (SQL editor or curl with anon key; expect SQLSTATE 23514 each)
Writes that must be rejected:
- `discount_type = null, discount_value = 5`
- `discount_type = 'percent', discount_value = 101`
- line `discount_type = 'amount'` with value above `round(price * quantity, 2)`
- `repair_items.total = -1`
- `repair_items.total` above `round(price * quantity, 2)`
- `repair_items.price = -1`
- `repair_items.quantity = 0`
- `repairs.total_price = -1`
Also confirm valid boundary rows are accepted: `percent 100`, `amount = gross`, `(null, 0)`.

## AC-23 migration atomic
On a scratch DB or inside a transaction you can discard:
1. Set a column type to non-numeric (e.g. `total_price` text) or insert `quantity = 0`; run `migration.sql`. Expect an exception and, afterwards, no new columns, constraints, `private` backup tables or changed values.
2. Normal DB: migration succeeds; preflight output (types, RLS state, `pg_policies`) pasted into `status.md` (SR-10).

## AC-24 backup not readable
`curl "$SUPABASE_URL/rest/v1/repair_items_total_backup_19" -H "apikey: $ANON" -H "Authorization: Bearer $ANON"` (also with `Accept-Profile: private`). Expect an error or `[]`, never rows. Same for `repairs_total_price_backup_19`.

## SR checks needing the UI/DB
- SR-2: in devtools, Network tab: payloads for repairs/repair_items contain only whitelisted columns (no `id`, `created_at` on repairs writes).
- SR-5: `1e3`, `0x10`, `Infinity`, `-5`, `5..0`, `12,345`, ` ` each show a Danish error and send no request.
- SR-6: set a test row to `discount_type = 'bogus'` (constraint temporarily dropped); bike screen renders, line shows no discount, no `NaN`.
- SR-11: console contains no payload dumps (`console.log(data)` removed); UI shows no Supabase `message`/`details`/`hint`/`code`.
- SR-15: documentation check: spec section 8 states `total_price` is not authoritative in v1.

## Round 1 fixes (F-1, F-3, F-4, UX-3)
- F-1 field errors: in the create/edit repair form, type `abc`, `1e3`, `0` or an empty value in Antal; expect "Ugyldigt tal" / "Antal skal være større end 0" and no save request. Type `abc` or `-5` in Pris; expect "Ugyldigt tal" / "Pris skal være 0 eller mere". Changing a line's Antal/Pris so a discount becomes invalid (e.g. kr discount above the new gross) re-shows the discount error without touching the discount field.
- F-4 retry after RepairSaveError: make `repair_items` inserts fail and the compensating delete fail (e.g. block both in devtools or temporarily revoke via RLS on a scratch DB), save a new repair; expect the generic Danish error. Restore access and press save again; expect `updateRepair` (PATCH on `repairs?id=eq.<id>`), no second POST to `repairs`, and exactly one repair row in the DB.
- F-3 store reflects saved totals immediately: after saving a new repair, the list/bike screen and front page show the saved total (with discounts) without reload or refetch (Network tab: no extra GET). Same after editing an existing repair.
- UX-3 toggle: the `%`/`kr` buttons are plain buttons in a labelled group; the active one has `aria-pressed="true"`, the other `"false"`; accessible names are "% (procent)" and "kr (kroner)". Verify with the accessibility tree in devtools; pressing toggles the state and revalidates the discount text.

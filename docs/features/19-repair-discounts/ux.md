# UX: Repair discounts (19-repair-discounts)

Mode: design. Target: web first. UI text in Danish. No new visual language: same modal, same `Input`/`Button`/`Text`/`Label`, same red error text (`#E24B4A`, 12px) as the rest of the modal.

## 1. Current UI (what we build on)
- `app/createRepairModal.tsx`: white 90%-wide card on a dark overlay. Left column: switches, dates, note, submit button (`Opret`/`Opdater`). Right: `RepairLinesSection`. The card has no scroll (`overflow: hidden`).
- `RepairLinesSection`: "Tilføj linje" button, header row (Beskrivelse / Antal / Pris / Total kr), one row per line (3 Inputs, a total, a red trash button), and a footer "I alt: x".
- Errors are `<Text style={styles.error}>` under the field. No field has `aria-invalid` yet.
- Existing weakness to fix while here: the line inputs have only a placeholder or no label, and the column headers are not tied to the inputs.

## 2. Reuse map
| Need | Use | New? |
|---|---|---|
| Discount value input | stock `Input` | reuse |
| `%` / `kr` choice | Two stock `Button`s (`size="sm"`, `variant` default when active, `outline` when not) in a `role="radiogroup"` wrapper, each `role="radio"` with `aria-checked` | new small wrapper `DiscountInput` in `components/ui/` |
| Error text | same red `Text` as the modal | reuse |
| Save error banner | stock `Alert` variant `destructive` with a lucide `CircleAlert` icon (it already has `role="alert"`) | reuse |
| Footer totals | `Text` rows | reuse |
| Line / repair discount control | `DiscountInput` (one component, used 2x per line and once in the footer) | new |

Why not stock `Select` for % / kr: it opens a portal popover for a 2-option choice, costs an extra click and a screen-reader hop per line, and its trigger is wider than the narrow column. A segmented toggle is one click, always visible, and shows the current type at a glance. Spec §9 allows "or a two-button toggle". Recommendation: use the toggle.

`DiscountInput` props (design-level): `value: Discount | null`, `onChange`, `label` (accessible name), `error?: string`, `base` for validation is handled by the parent. It keeps the raw text in local state (see §5) so the user can type `12,` and clear the field.

## 3. Layout

### 3.1 Line row (desktop, >= 768px)
Columns: Beskrivelse (3) · Antal (1) · Pris (1) · Rabat (2) · Total kr (1) · trash (40px).
The Rabat cell holds the value input and, to its right, the `% | kr` toggle.

```
Beskrivelse        Antal   Pris    Rabat            Total kr
[Bremsekabel     ] [ 2 ]  [150 ]  [10    ][%|kr]    270.00      [trash]
                                  Procent skal være mellem 0 og 100   <- error spans Rabat cell, under row
```
- Line total shows 2 decimals (`toFixed(2)`), net of line discount (AC-1, OQ-8). The existing `toFixed(0)` must go.
- When a line has a discount, show a small muted line under the total: `−30.00` (the line discount). Cheap, and answers OQ-8 without a gross column. Hidden when no discount.
- Error row: error text sits directly beneath the Rabat cell, `aria-describedby` points at it. The row grows; other columns stay top-aligned (`alignItems: 'flex-start'`, not `center`, so errors do not push inputs off the baseline).

### 3.2 Footer (below lines, right-aligned, max width ~320px)
Shown when there is at least one line. (Spec E6 says a repair with no lines and a discount totals 0; the repair-level control is hidden with no lines, and any existing discount is kept in form state but displays nothing. See blocker note B-1.)

```
                              Subtotal              570.00
                              Rabat  [5     ][%|kr]  −28.50
                                     (error text here)
                              ─────────────────────────────
                              I alt                 541.50
```
- Labels left, amounts right-aligned in a fixed-width tabular column so digits line up.
- `Rabat` amount is shown with a real minus sign `−` (U+2212), muted when 0 (`−0.00` is never shown; show `0.00`).
- `I alt` is bold, slightly larger (text-base, `font-semibold`), above it a 1px top border (`#e5e5e5`, as existing).
- Amounts are `aria-live="polite"` on the `I alt` value only (not per keystroke spam: debounce is not needed because screen readers coalesce polite updates).

### 3.3 Narrow width (< 768px, incl. phone-width browser)
The modal is 90% wide; a 6-column row does not fit. Per line, stack into a card:

```
┌──────────────────────────────────────┐
│ Beskrivelse [Bremsekabel          ]  │ [trash]
│ Antal [ 2 ]   Pris [ 150 ]           │
│ Rabat [10   ] [%|kr]                 │
│ Total kr                    270.00   │
└──────────────────────────────────────┘
```
- The header row is hidden; each input gets a visible `Label` above it instead (the label is the header in the wide layout and becomes visible text here; in the wide layout it is the column header, referenced by `aria-labelledby`).
- Switch layout with `useWindowDimensions().width < 768` (matches Tailwind `md`).
- Footer becomes full width, same rows.
- The two-column modal body (form left, lines right) should stack vertically below 768px and the card must scroll (`ScrollView`, `maxHeight: 90vh`). Today it clips; with the added footer rows this becomes a real blocker for narrow and short viewports, so scrolling is required for this feature. Keep the Opret/Opdater button reachable: put it after the lines section on narrow widths.
- Touch targets: toggle buttons and inputs at least 44x44 CSS px on narrow (WCAG 2.2 target size AA minimum is 24px; 44 is the product-friendly target). On wide, 36px (`h-9`) is acceptable (>= 24).

## 4. States

### DiscountInput (line and repair)
| State | What the user sees |
|---|---|
| Empty / none | Input empty with placeholder `0`, toggle defaults to `%` (type is remembered as UI state; stored as `null` when value is 0 or empty, AC-12). Line total = gross. |
| Typing, valid | Value as typed (`12,5` stays `12,5`), totals recalculate live. |
| Active | Standard focus ring from stock `Input` (3px ring). |
| Invalid | Input border red (`aria-invalid`), error text under it (copy §6), totals fall back to the clamped values from the calculator so numbers never go negative; submit blocked. |
| Disabled (while saving) | Input and toggle `disabled`, 50% opacity (stock behavior). |
| Prefilled (edit) | Saved type toggle on, saved value shown (`5`, not `5.00`; keep up to 2 decimals as saved, `12.5` shown as `12,5`; see §5). Totals equal the saved `total_price` (AC-11). |

### Modal
| State | What the user sees |
|---|---|
| Idle | As today. Submit shows `Opret` (new) / `Opdater` (edit). |
| Validation failed | Errors under each bad field. Focus moves to the first invalid field (RHF `shouldFocusError`; ensure the discount inputs forward `ref`). No request sent. A line-level error also marks the row so it is findable on a long list (red left border on the row, in addition to text; text is the primary signal). |
| Saving | Button disabled, label `Gemmer…`. Prevents double submit (today double-click creates two repairs). |
| Save success | Modal closes (`router.back()`), only after success. |
| Save failure | Modal stays open, all input kept. Destructive `Alert` at the top of the lines section, above the submit button on narrow: title `Reparationen kunne ikke gemmes`, description `Prøv igen. Dine ændringer er ikke tabt.` Button re-enabled with its normal label. Alert has `role="alert"` so it is announced; also move focus to the submit button (focus stays where the user acted; do not steal it to the banner). Cleared on next submit attempt. |
| Lines empty | Footer hidden, repair discount hidden. Empty hint under "Tilføj linje": `Ingen linjer endnu. Tilføj en linje for at se pris og rabat.` (muted). |
| Loading (edit) | The form is populated from the store synchronously; no new loading state needed. |

## 5. Interaction details
1. **Raw text buffer.** The existing pattern `onChangeText={(t) => onChange(Number(t) || 0)}` makes it impossible to type `12,` or to clear the field (it snaps to 0 and `Number("12,5")` is NaN). `DiscountInput` must hold the string locally and push a parsed value to the form on each change. Rules: replace `,` with `.`, trim; empty = value 0 (no discount, no error); anything that is not a finite number = `Ugyldigt tal` with the invalid raw text preserved (do not silently replace with 0, AC-6 non-numeric). Display uses a decimal comma on web (`12,5`) since the UI is Danish; internal value uses `.`.
2. **Numeric input.** `keyboardType="numeric"` plus on web `inputMode="decimal"`, `autoComplete="off"`. Not `type="number"` (it blocks the comma and breaks screen-reader announcement of partial input).
3. **Toggle behavior (AC-5).** Clicking the other type keeps the typed value and recalculates. If the kept value is now invalid (e.g. 150 % -> kr is fine, 150 kr -> % is >100), show the error immediately; do not clear the user's input.
4. **Validation timing.** Validate on change after first blur of that field (`mode: 'onTouched'`-like), and always on submit. Also revalidate when the base changes (price, quantity, other lines): a flat discount that was valid can become invalid after the user lowers the price. The error appears on the discount field, not on the price field, with the same copy.
5. **Zero and clear (AC-12).** `0`, `0,00` and an empty field all mean no discount: no error, no `Rabat` deduction shown.
6. **Persisted-total mismatch.** Totals shown in the modal always come from `calculateRepairTotals`, never from stored `total`.
7. **Submit button label.** The current label is `repair?.items?.length ? 'Opdater' : 'Opret'`. A saved repair with zero lines would say `Opret` but run an update. Base the label on `repair.id !== 0` (matches `onSubmit`). Flagging as a related bug, not a blocker.

## 6. Copy (Danish)
| Where | Text |
|---|---|
| Column header / label, line | `Rabat` |
| Toggle options | `%` and `kr`. Accessible names: `Procent` and `Kroner` |
| Toggle group name | `Rabattype for <linjens titel, eller "linje N">` / `Rabattype for reparationen` |
| Input accessible name, line | `Rabat for <titel eller "linje N">` |
| Input accessible name, repair | `Rabat på reparationen` |
| Placeholder | `0` |
| Footer labels | `Subtotal`, `Rabat`, `I alt` |
| Line discount hint (under line total) | `−30.00` |
| Errors (from `validateDiscount`, verbatim) | `Rabat skal være 0 eller mere` · `Procent skal være mellem 0 og 100` · `Rabat kan ikke overstige beløbet` · `Ugyldigt tal` |
| Save failure title | `Reparationen kunne ikke gemmes` |
| Save failure body | `Prøv igen. Dine ændringer er ikke tabt.` |
| Saving button | `Gemmer…` |
| No lines hint | `Ingen linjer endnu. Tilføj en linje for at se pris og rabat.` |

Suggested refinement of `Rabat kan ikke overstige beløbet`: it is correct but vague. Prefer a message that names the base; if the calculator can return it without API change, keep the spec strings verbatim (they are the contract) and let the component append nothing. Keep as is for v1.

Number format: 2 decimals, `.` separator as existing `toFixed(2)` and OQ-6 (no Danish thousands formatting now). Note the inconsistency: inputs accept and display a comma but totals show a dot. Accept for v1 (consistent with OQ-6), but when OQ-6 is picked up, change both. To avoid mixed display inside the field, an acceptable alternative is to show the user's raw typed text and not reformat on blur.

## 7. Accessibility (WCAG 2.2 AA)
- **Labels.** Every input has a programmatic name, not placeholder only. Use `aria-label` on the line inputs (names include the line title or number, since 10 identical "Rabat" fields are useless to a screen-reader user) and `Label nativeID` + `aria-labelledby` where a visible label exists (narrow layout, repair discount). This follows the modal's existing `Label nativeID` pattern. Also add names to the existing Antal/Pris/Beskrivelse inputs while touching the rows (1.3.1, 4.1.2).
- **Toggle.** `role="radiogroup"` with an accessible name, children `role="radio"` and `aria-checked`. Keyboard: Tab to the group (roving tabindex; selected is the tab stop), Left/Right (and Up/Down) arrows change selection, Space selects. If roving tabindex is too costly in the stock Button, fall back to two buttons with `aria-pressed`, each Tab-reachable; this is acceptable AA.
- **Do not rely on colour.** Active toggle: filled background plus `aria-checked`; inactive: outlined. Errors: red text plus the message text plus `aria-invalid="true"`. Error text colour `#E24B4A` on white is ~3.9:1, which **fails** 1.4.3 (4.5:1) for 12px text. Use the theme `text-destructive` token if it passes, otherwise `#C62828` (5.6:1). Check the same for the muted `−30.00` hint and use at least `text-muted-foreground` at 4.5:1.
- **Errors.** Error text linked via `aria-describedby`; set `aria-invalid`. On a failed submit, focus the first invalid field (3.3.1, 3.3.3). Error messages say what is wrong and the range (they do).
- **Live regions.** `I alt` value `aria-live="polite"`; save-failure `Alert` is `role="alert"`. Not on every row total.
- **Focus.** Stock `Input` and `Button` already have visible 3px rings (2.4.7, 2.4.11 focus not obscured: the sticky nothing; ensure the scrolled modal does not put the focused field under a fixed footer). After removing a line (trash), move focus to the next line's description input or, if none, to "Tilføj linje". After "Tilføj linje", focus the new line's Beskrivelse input. The trash button needs an accessible name: `Fjern linje <titel eller N>` (it is icon-only today, fails 4.1.2).
- **Tab order.** Row by row: Beskrivelse, Antal, Pris, Rabat value, Rabat type, trash. Then "Tilføj linje"... footer repair discount value, type, then submit. In the narrow stacked layout DOM order equals visual order.
- **Target size.** 2.5.8: all controls >= 24x24; the toggle buttons 36px high min.
- **Reflow / zoom.** 1.4.10: at 320 CSS px wide and 400 % zoom the narrow layout applies and nothing needs two-axis scroll; the modal scrolls vertically only. Text may be enlarged to 200 % without clipping (no fixed heights on rows; errors can wrap).
- **Reduced motion.** No animations introduced. Do not animate totals counting; the `Alert` appears without transition.
- **Screen-reader strings for money.** `−28.50` is read as "minus 28.50" or "dash"; set `aria-label="Rabat minus 28,50 kroner"` is overkill; instead render the visually shown `−` with the label `Rabat` and let the value be plain text. Acceptable.

## 8. User flows (per UI AC)
- **AC-1/2 line discount.** Open modal, add line, enter Antal 2, Pris 150, Rabat `10`, `%` -> Total kr shows 270.00, Subtotal 270.00. Choose `kr` and `50` on a 350 line -> 300.00.
- **AC-3/4/5 repair discount.** In footer enter `5` with `%` -> `Subtotal 570.00`, `Rabat −28.50`, `I alt 541.50`. Click `kr`, value kept, 5 kr -> `−5.00`, `I alt 565.00`. Only one repair discount ever exists.
- **AC-6 validation.** Enter `101` with `%` -> `Procent skal være mellem 0 og 100`; `-5` -> `Rabat skal være 0 eller mere`; `abc` -> `Ugyldigt tal`; `500 kr` on a 350 line -> `Rabat kan ikke overstige beløbet`. Click Opret: nothing sent, focus on first bad field.
- **AC-8/9 save.** Click Opret/Opdater -> button `Gemmer…` -> success closes modal.
- **AC-11 edit.** Open saved repair: line and repair discounts are prefilled with saved type and value, totals match stored `total_price`.
- **AC-12.** Clear or `0` -> no discount, no error.
- **AC-14 failure.** Server rejects -> modal stays open, `Alert` `Reparationen kunne ikke gemmes`, form values untouched, button usable again.
- **Remove a line** that carries an error: its error disappears with it and the footer recalculates.

## 9. Responsive summary
| Width | Change |
|---|---|
| >= 768px | Table-style rows with column headers, Rabat column, footer right-aligned (max ~320px). Modal body keeps form left / lines right. |
| < 768px | Per-line stacked card with visible labels, header row hidden, footer full width, body stacks vertically, card scrolls, submit after the lines. |
| <= 360px | Antal and Pris share a row at 50 % each; Rabat value takes the full row with the toggle under it if it does not fit on one line (`flexWrap: 'wrap'`). |

## 10. Out of scope here
iOS/Android (`createRepairModal.ios.tsx` gets line discounts via the shared section only; repair-level discount and the save error are absent there, as per spec §9). Danish number formatting (OQ-6).

## 11. OQ-8 (show discount on the bill)
Agree with the recommended default: line total shows net, footer shows Subtotal / Rabat / I alt, no gross column. Addition: show the line discount amount as a small muted `−30.00` under the line total when a discount exists. This keeps the table narrow (no extra column) and makes the saving visible without leaving the row. A gross column would not fit at narrow widths. Printed or invoice output is out of scope.

## 12. Spec blockers
None blocking design. Notes for the spec owner:
- **B-1 (non-blocking, clarify).** Spec does not say what happens to an existing repair-level discount when all lines are removed. Recommendation: control stays visible whenever a discount exists or lines exist; with no lines it shows `Subtotal 0.00`, so a flat discount > 0 is an error (`Rabat kan ikke overstige beløbet`) and must be fixable. Simplest: hide the footer only when there are no lines AND no discount.
- **B-2 (non-blocking).** AC-1 requires 2-decimal line total (`270.00`); current UI shows `toFixed(0)`. Implementation must change it.
- **B-3 (non-blocking).** `createRepairModal.tsx` has no scroll and a fixed overflow-hidden card; narrow/short viewports will clip the footer and discount errors. Scroll container is part of this feature's frontend scope (spec §9 lists the modal).
- **B-4 (non-blocking).** Error text colour `#E24B4A` fails 4.5:1 contrast at 12px. Use a compliant colour for the new error text (and ideally the existing).

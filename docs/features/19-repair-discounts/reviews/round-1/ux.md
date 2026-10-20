# UX review: 19-repair-discounts, round 1

**VERDICT:** CHANGES_REQUESTED
**Scope reviewed:** `git diff main...feature/19-repair-discounts` for `components/ui/DiscountInput.tsx`, `components/ui/RepairLinesSection.tsx`, `app/createRepairModal.tsx`, `components/ui/recentRepairCard.tsx`, `app/(tabs)/customers/[id]/[bikeId].tsx`, against `ux.md` and spec §7 (AC-1..6, 11, 14, 16, 18..21). Static code review only. No dev server was run, so layout findings come from reading the styles and are not visually confirmed.
**Counts:** blocker: 0 · major: 2 · minor: 7

## Findings

### UX-1 · major · Wide layout stacks Antal and Pris vertically
- **Where:** `components/ui/RepairLinesSection.tsx` (line row, wrapper `narrow ? styles.pairRow : { flex: 2 }`)
- **Problem:** On wide (>= 768px) the wrapper around the Antal and Pris cells is `{ flex: 2 }` with no `flexDirection: 'row'`. RN default is column, so Antal sits above Pris. The row no longer matches the headers (Beskrivelse / Antal / Pris / Rabat / Total kr), and the Pris input lands under the Antal column. Web desktop is the primary target.
- **Fix:** Use `{ flex: 2, flexDirection: 'row' }` for the wide wrapper. The cell paddings already exist.
- **Refs:** ux.md §3.1, WCAG 1.3.1 (header/column association)

### UX-2 · major · Discount errors are not shown live in several cases (type toggle, non-numeric)
- **Where:** `RepairLinesSection.tsx` `baseKey` / revalidation effect. `useForm` in `createRepairModal.tsx` has no `mode`, so it validates on submit only.
- **Problem:**
  1. `baseKey` contains only each discount's `value`, not its `type`. Switching `%` to `kr` (or back) with the same number never re-triggers validation. 150 kr to `%` shows no "Procent skal være mellem 0 og 100" until submit. A stale error also stays after a toggle that makes the value valid. ux.md §5.3 requires an immediate error and AC-5 depends on it.
  2. `JSON.stringify(NaN)` is `null`, the same as "no discount". Typing `abc` never changes `baseKey`, and a discount that is NaN still enters `names`, but no trigger fires. "Ugyldigt tal" therefore appears only after clicking Opret. ux.md §5.4 asks for validation after first blur or on change.
  3. A blur does not validate (`mode` is onSubmit).
- **Fix:** Add `i?.discount?.type` and `String(i?.discount?.value)` (so NaN is distinguishable) to `baseKey`, plus the repair discount's type and value. Or set `useForm({ mode: 'onTouched' })` and call `trigger` from the toggle.
- **Refs:** AC-5, AC-6, ux.md §5.3, §5.4, WCAG 3.3.1

### UX-3 · minor · `%`/`kr` toggle: ARIA radio pattern without arrow keys (disputes the "accepted gap" as built)
- **Where:** `DiscountInput.tsx:120-134`
- **Problem:** The Tab-only fallback is allowed by ux.md §7, but the fallback it names is two buttons with `aria-pressed`. The build uses `role="radiogroup"` / `role="radio"` and puts both radios in the tab order. Screen-reader users will expect arrow-key navigation inside a radiogroup, and that is not there. The WAI-ARIA radio pattern is only half implemented.
- **Fix:** Either keep the gap and switch to plain buttons with `aria-pressed` plus a `role="group"` and label, or add arrow-key handling with roving `tabIndex`. The gap is acceptable only with the first option.
- **Refs:** WCAG 4.1.2, ux.md §7 Toggle

### UX-4 · minor · Toggle accessible name does not contain the visible text
- **Where:** `DiscountInput.tsx:128` (`aria-label="Procent"` / `"Kroner"` over visible `%` / `kr`)
- **Problem:** Voice-control users saying "click kr" or "click percent sign" may not match. ux.md §6 asks for these names, so this is a minor tension within the spec.
- **Fix:** Use `aria-label="kr, kroner"` and `"% procent"`, or drop the override and rely on the group label.
- **Refs:** WCAG 2.5.3

### UX-5 · minor · Focus lost after a failed save
- **Where:** `createRepairModal.tsx` `submitButton` (`disabled={isSaving}`) and `onSubmit`
- **Problem:** Disabling the focused button on web drops focus to `body`. ux.md §4 says focus should stay on or return to the submit button after a failure. After a failure, the next Tab starts at the top of the page.
- **Fix:** Keep a ref to the button and call `.focus()` in the catch path after `setIsSaving(false)`. Or use `aria-disabled` and ignore presses while saving.
- **Refs:** WCAG 2.4.3, ux.md §4

### UX-6 · minor · Trash button position and size in the narrow card
- **Where:** `RepairLinesSection.tsx` trash `Button` inside `styles.lineCard`
- **Problem:** The wireframe has the trash at top right. In the column card it is a 40px-wide, 36px-high button at the bottom left, below the Total row. It is easy to hit by mistake and sits below the 44px narrow target the spec prefers (24px AA is met). It also has no confirmation, though it is aria-labelled.
- **Fix:** In narrow, set `alignSelf: 'flex-end'` and `h-11`, or move it into the Beskrivelse row.
- **Refs:** ux.md §3.3, §7 Target size

### UX-7 · minor · Antal and Pris still snap decimals to 0 while typing
- **Where:** `RepairLinesSection.tsx` Antal and Pris `onChangeText={(t) => onChange(Number(t) || 0)}`
- **Problem:** Typing `99.50` gives "99." then 99, so "99" is shown and the decimal point is lost. A price like 12.50 cannot be entered. The totals now show 2 decimals, which makes this more visible. This is pre-existing and outside the discount ACs, but ux.md §5.1 describes the same bug.
- **Fix:** Reuse the raw-text buffer pattern from `DiscountInput` for Pris, or log as follow-up.
- **Refs:** ux.md §5.1

### UX-8 · minor · Footer repair-discount row is tight at 320px
- **Where:** `RepairLinesSection.tsx` `styles.footerRow` and `styles.amount` (`minWidth: 80`)
- **Problem:** At 320px the modal is about 268px of content. Label (~40) + amount (80) + padding leaves about 130px for the input and toggle. `flexWrap` should make the toggle wrap under the input, but the error text then wraps in a ~130px column. No two-axis scroll is expected, but please verify at 320px and at 400% zoom.
- **Fix:** In narrow, stack the footer Rabat row as label above input, with the amount on its own row.
- **Refs:** WCAG 1.4.10

### UX-9 · minor · Verify contrast of the destructive Alert description
- **Where:** `createRepairModal.tsx` Alert block (`AlertDescription`, stock `text-destructive/90`)
- **Problem:** The `/90` alpha lowers contrast on small text. The theme `destructive` token is probably near 4.5:1 before the alpha. Our own error text is correct at #C62828 (5.6:1).
- **Fix:** Pass `className="text-[#C62828]"` to `AlertTitle` and `AlertDescription`, or check the theme value.
- **Refs:** WCAG 1.4.3

## Previously reported (round >= 2)
| ID | Status |
|---|---|
| - | first round |

## Notes
Checked and fine:
- Danish copy matches ux.md §6 verbatim (`Reparationen kunne ikke gemmes`, `Prøv igen. Dine ændringer er ikke tabt.`, `Gemmer…`, the empty hint, the footer labels, and the validator strings coming from `validateDiscount`).
- Error colour is #C62828 everywhere, including the existing `styles.error`, which also resolves B-4.
- The red left border on the row is paired with error text, so colour is not the only cue.
- Line inputs have programmatic names (`aria-label` on wide, `aria-labelledby` on narrow). The repair discount uses `labelledBy`. The trash button is named `Fjern linje <name>`.
- `aria-invalid` and `aria-describedby` are wired, and the stock Input styles `aria-invalid:border-destructive`.
- `aria-live="polite"` is on `I alt` only.
- Focus handling after add and remove, the `Gemmer…` disabled state, and keeping the form open with input intact on failure are all implemented.
- The submit label is now based on `repair.id !== 0` (ux §5.7), and the submit button moves after the lines on narrow.
- Prefill shows `5` and `12,5`.
- Totals use 2 decimals, including `recentRepairCard.tsx` and `[bikeId].tsx` (AC-18..21 display).
- The footer shows when lines or a discount exist (B-1). The modal scrolls (B-3).
- Target sizes are at least 36px wide and 44px narrow, above the 24px AA minimum.

Accepted gap (no arrow-key roving): confirmed acceptable only if the role is changed to `aria-pressed` buttons (see UX-3). As built it is a minor ARIA-pattern mismatch, not a blocker.

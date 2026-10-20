# UX review: 19-repair-discounts, round 2

**VERDICT:** PASS
**Scope reviewed:** `git diff 8d8c6fa..HEAD -- components app lib/theme.ts` against `ux.md`, spec §7 (new Antal/Pris errors, AC-25) and round-1 findings. Static code review only. No dev server was run.
**Counts:** blocker: 0 · major: 0 · minor: 2

## Findings

### UX-10 · minor · "Ugyldigt tal" flashes while typing a trailing separator
- **Where:** `components/ui/RepairLinesSection.tsx` `parseNumberText` / `NumberField`, together with the revalidation effect on `baseKey`
- **Problem:** Typing `12,` or `99.` gives NaN, because the regex needs digits after the separator. `baseKey` changes on every keystroke and triggers validation, so "Ugyldigt tal" appears mid-entry and clears on the next digit. This is transient and does not block entry. It is noisy for screen-reader users if the error is announced.
- **Fix:** Let `parseNumberText` accept a trailing separator (`^\d{1,8}[.,]?$`) as the number so far, or leave it as is. DiscountInput's behaviour for the same case should be the reference for consistency.
- **Refs:** ux.md §5.4, WCAG 3.3.1

### UX-11 · minor · Narrow card: trash button is top-right visually but last in tab order
- **Where:** `RepairLinesSection.tsx`, `styles.trashNarrow` (absolute) and the Button's position in the JSX after the Total cell
- **Problem:** Visual order (top right) and DOM and focus order (last) differ. Keyboard users on narrow web tab to it after Total. This is a mild mismatch.
- **Fix:** Move the Button earlier in the JSX (first child of the card). The absolute positioning means the layout does not change.
- **Refs:** WCAG 2.4.3, 1.3.2

## Previously reported (round >= 2)
| ID | Status |
|---|---|
| UX-1 | fixed. The wide wrapper is `{ flex: 2, flexDirection: 'row' }`. |
| UX-2 | fixed. `baseKey` now contains `type:String(value)` for each line and for the repair discount, so toggles and NaN both re-trigger. The line quantity and price are revalidated too. |
| UX-3 | fixed. `role="group"` with `aria-pressed` buttons. |
| UX-4 | fixed. Names are `% (procent)` and `kr (kroner)`, and both contain the visible text. |
| UX-5 | fixed. The `focusSubmit` flag plus an effect focuses `submitRef` once `isSaving` is false. |
| UX-6 | fixed in size and position (44x44 absolute top right, 48px right padding on Beskrivelse). A tab-order nit remains, see UX-11. |
| UX-7 | fixed. `NumberField` keeps raw text with strict parse and `12,5` works. A minor flash remains, see UX-10. |
| UX-8 | deferred. Manual check at 320px and 400% zoom is still needed. |
| UX-9 | fixed. `AlertTitle` and `AlertDescription` get the inline `ERROR_TEXT_COLOR` (#C62828, 5.6:1). |

## Notes
Checked and fine:
- New Antal/Pris errors: copy matches spec §7 ("Antal skal være større end 0", "Pris skal være 0 eller mere", "Ugyldigt tal"). The error text uses `ERROR_TEXT_COLOR`. `aria-invalid` and `aria-describedby` are wired to `nativeID` ids that are unique per field.
- AC-25 and the retry path: `RepairSaveError` calls `setValue('id', repairId)`, and the submit label follows `watch('id')`, so it shows "Opdater" on retry.
- `ERROR_TEXT_COLOR` now lives in `lib/theme.ts` and the imports are updated. The leftover `checkedComplete` state is removed with no remaining references.
- Not visually verified: that the error line under an input does not misalign the wide column headers.

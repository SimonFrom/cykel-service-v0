# Fixes: 19-repair-discounts, round 2

All four reviewers: 0 blockers, 0 majors → exit condition met, proceed to docs + Gate 2.
Round-1 findings: all fixed (CR-3 partially — see CR-10).

## To fix (blockers and majors)
None.

## Deferred (minors)
| ID | Owner | Summary |
|---|---|---|
| CR-9 (= security note) | backend + frontend | After a `RepairSaveError` retry the repair isn't added to the store list (`updateRepairInStore` only maps); returned Repair keeps placeholder item ids. Fix: upsert in `updateRepairInStore` |
| SEC-7 | backend | Hardening item in the save path; details in the local security report |
| SEC-3 (conditional) | frontend | Input validation follow-up, depends on the preflight output; details in the local security report |
| CR-10 | backend + frontend | `displayTotals` fallback chain; one invalid line discount drops all line discounts from the display; move a per-line lenient variant into `lib/repairPricing.ts` |
| CR-11 | frontend | `parseNumberText`/`NumberField` duplicate DiscountInput's parse pattern (2nd occurrence — extract on 3rd) |
| CR-12 | frontend | Reuse `refProp` instead of `{...({ ref } as object)}` |
| UX-10 | frontend | "Ugyldigt tal" flashes while typing trailing `,`/`.` in Antal/Pris |
| UX-11 | frontend | Narrow card: trash button last in tab order |
| QA-8 | tests | No unit tests for `parseNumberText`, `validateQuantity`, `validatePrice` (AC-25) |
| SEC-6 / QA-4 | user decision | Hardening item for the migration's backup tables; details in the local security report |
| UX-8, QA-9 | user | Manual checklist + migration run; preflight + pg_policies output into status.md (SR-10) |
| CR-6 / QA-7 | — | iOS modal intentionally unchanged |
| QA-6 | — | Generic error for missing customer/bike |
| — | — | `roundMoney(1.005)` = 1.00 (float); unreachable via 2-decimal form input |

## Disputes
None.

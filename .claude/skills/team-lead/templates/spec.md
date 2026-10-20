# Spec: <Feature name>

- **Slug:** <slug>
- **Status:** draft | approved
- **Contract version:** 1
- **Author:** spec-writer · **Approved by:** <user> on <date>

## 1. Problem & goal
<!-- One paragraph: who has what problem, and what success looks like. -->

## 2. Users & permissions
| Role | Can do |
|---|---|

## 3. Acceptance criteria
<!-- Each criterion is testable and uses Given/When/Then. QA writes one test per AC. -->
- **AC-1:** Given …, when …, then …
- **AC-2:** …

## 4. API contract
<!-- Source of truth for parallel FE/BE build. Concrete types only. -->
### `METHOD /path`
- **Auth:** required / role
- **Request:**
  ```ts
  { field: string /* constraints */ }
  ```
- **Response 200:**
  ```ts
  { … }
  ```
- **Errors:** `400 { code: "VALIDATION", fields: {...} }`, `401`, `403`, `404`, `409`

## 5. Data model changes
<!-- New tables/fields, indexes, migrations, data retention. -->

## 6. Non-functional requirements
<!-- Performance, limits, availability, i18n, browser support — with numbers. -->

## 7. Data sensitivity
<!-- What data is touched, PII, who may access it. Input for the threat model. -->

## 8. Work breakdown
- [shared] …
- [backend] …
- [frontend] …

## 9. Out of scope
-

## 10. Open questions
| # | Question | Recommended default |
|---|---|---|

## Changelog
- v1 — initial

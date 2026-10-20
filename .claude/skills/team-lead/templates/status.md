# Status: <slug>

```yaml
slug: <slug>
request: "<original feature request>"
issue:          # GitHub issue URL, if started from one
base: main
branch: feature/<slug>
phase: intake   # intake | spec | gate1 | plan | build | review | fix | docs | gate2 | done | escalated
round: 0        # review round, max 3
has_ui: true
gate1_approved: false
gate2_approved: false
```

## Log
<!-- Append one line per phase transition: date — phase — outcome -->
- <date> — intake — created

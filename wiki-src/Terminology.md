# Terminology

Ladderline uses a fixed, deliberately small vocabulary. Contributors should never introduce a synonym for any of these terms — not in code, comments, commit messages, or docs — since consistency here is what makes the CLI self-explanatory.

| Term | Meaning | Example |
|---|---|---|
| **Ladder** | The career framework file — a set of competencies with current/next-level descriptions | `senior-to-staff-eng.yaml` |
| **Tag** | A single competency/row on a ladder | `technical-direction` |
| **Note** | A single evidence entry — a dated, short record of something observed | "Pushed back on the caching design..." |
| **Notag** | A note saved without a tag, because it doesn't yet cleanly fit a competency | reuses the word "tag" deliberately — a note either has a tag, or is a notag |
| **Case** | The final assembled output handed to a calibration process | `ladderline case "Sarah Chen"` |
| **Cycle** | A named review period (a date range) that scopes which notes a case pulls from | `2026-Q1` |
| **Dashboard** | The local web view (person / team grid / insights / notes tabs) | `ladderline dashboard` |
| **Track** | Start recording evidence about a person | `ladderline track "Sarah Chen"` |
| **`--as`** | The relationship between the manager and the tracked person | `report`, `self`, `mentee`, `cross-team`, `peer` |

## Why these specific words

- **Note**, not "log" — avoids reading as a machine/observability log; this is human, qualitative evidence.
- **Case**, not "packet" — matches the language managers already use ("build the case for promotion").
- **Notag**, not "unfiled"/"freeform" — reuses "tag" instead of introducing a new noun, so the relationship between the two concepts is obvious without explanation.
- **Cycle**, not "period" or "season" — plain, unambiguous, matches how most companies already talk about review cycles.

## Rejected terms (for reference — don't reintroduce these)

`packet`, `log`, `unfiled`, `freeform`, `relationship` (flag name — replaced by `--as`), `add-person` (command — replaced by `track`).

# CLI Reference

All commands are additive-only by default — nothing overwrites or deletes silently. Any destructive or ambiguous action (deleting a note/person, importing overlapping data) requires explicit confirmation. See [[Error-Handling]] for the full philosophy.

Every command supports `--help`. `ladderline help` with no arguments lists everything below.

---

### `ladderline init`
Creates the `./ladderline/` workspace in the current directory and prompts for a starter ladder.

```
ladderline init
ladderline init --demo      # also seed an obviously-fake demo person + notes
```

---

### `ladderline demo`
Spins up a fully separate, throwaway demo workspace. Never touches an existing real workspace.

```
ladderline demo
```

---

### `ladderline ladder list`
Shows all ladder files currently registered in the workspace.

```
ladderline ladder list
```

---

### `ladderline ladder add <file.yaml>`
Registers a custom or company ladder file into the workspace.

```
ladderline ladder add company-ladder.yaml
```

---

### `ladderline track "<name>"`
Starts tracking a person — creates their folder and records which ladder applies and their relationship to the manager.

```
ladderline track "John Doe" --ladder senior-to-staff-eng.yaml --as report
```

| Flag | Values | Required |
|---|---|---|
| `--ladder` | any registered ladder filename | yes |
| `--as` | `report`, `self`, `mentee`, `cross-team`, `peer` | yes |

Tracking yourself for your own promotion case works the same way: `ladderline track "Me" --as self`.

---

### `ladderline note --person "<name>"`
Logs a single evidence entry against a person.

```
ladderline note --person "John Doe" --tag technical-direction \
  --date 2026-02-10 \
  "Pushed back on the caching design in the payments migration doc..."
```

| Flag | Values | Required |
|---|---|---|
| `--person` | a tracked person's name | yes |
| `--tag` | a valid tag on that person's ladder | yes, unless `--notag` |
| `--notag` | flag, no value | required explicitly if no valid `--tag` is given |
| `--date` | `YYYY-MM-DD`, defaults to today | no |

Refuses to run if the person isn't tracked, or if `--tag` doesn't match the person's assigned ladder (see [[Error-Handling]]).

---

### `ladderline dashboard`
Starts the local web UI at `http://localhost` (no external network access). See the dashboard design doc for the Person / Team grid / Insights / Notes tabs.

```
ladderline dashboard
```

---

### `ladderline case "<name>"`
Assembles a case from that person's notes, grouped by tag, scoped to a cycle. Never invents or paraphrases — only assembles what was actually logged.

```
ladderline case "John Doe" --cycle 2026-Q1 --format docx
```

| Flag | Values | Required |
|---|---|---|
| `--cycle` | a defined cycle name | yes |
| `--format` | `docx` (default) or `md` | no |
| `--prompt` | flag, no value | no |

Refuses to run if there are zero notes for that person in the given cycle.

**`--prompt`** generates a sibling `.prompt.txt` file alongside the case (e.g. `john-doe.prompt.txt`) — a ready-made prompt the user can paste into any LLM (Claude, ChatGPT, a local model) to turn the extractive case into polished narrative prose. Ladderline never calls an LLM itself; this keeps the core tool fully deterministic and puts the "invention" step explicitly in the user's hands, outside the tool. The prompt embeds its own guardrails (never invent or embellish beyond what's given, state gaps plainly rather than fabricating strengths, keep dates for traceability).

```
ladderline case "John Doe" --cycle 2026-Q1 --prompt
```

**Bulk mode:**
```
ladderline case --all --cycle 2026-Q1
ladderline case --all --cycle 2026-Q1 --as report
ladderline case --all --cycle 2026-Q1 --prompt
```
Generates one file per tracked person into `./cases/<cycle>/`, e.g. `./cases/2026-Q1/john-doe.docx`. `--as` filters to a relationship (e.g. only direct reports). `--prompt` generates one `.prompt.txt` per person alongside each case. Anyone with zero notes that cycle is skipped with a warning; the rest still generate.

---

### `ladderline notag list`
Lists notag entries (notes without a tag) so they can be reviewed and assigned. Same underlying view as the Notes tab in the dashboard, filtered to `tag: none`.

```
ladderline notag list --person "John Doe"
```

---

### `ladderline cycle add <name>`
Defines a named review period.

```
ladderline cycle add 2026-Q2 --start 2026-04-01 --end 2026-06-30
```

---

### `ladderline export`
Zips the entire workspace for backup or transfer to another machine. Accepts optional filters to export a deliberate slice instead of everything — useful for sharing only one person's notes (e.g. for a 360) without exposing every other report's evidence.

```
ladderline export                          # full workspace
ladderline export --person "Jan Kowalski"  # just one person
ladderline export --cycle 2026-Q1          # just one cycle, across everyone
ladderline export --since 2026-01-01       # everything logged after a date
```

---

### `ladderline import <file.zip>`
Restores or merges a workspace from an exported zip. Expects the same structure `export` produces — not designed to ingest an arbitrary hand-zipped folder.

```
ladderline import backup-2026-06-01.zip
```

- If no workspace exists in the current directory, import creates one (effectively `init` + `import` combined). If one exists, it merges into it.
- Any `ladders/` files in the zip not already present locally are brought in automatically — a note pointing at a missing ladder would otherwise be orphaned. A note whose ladder truly can't be resolved lands as a **notag** entry with a warning, rather than failing silently.
- Conflicts are resolved **file-by-file**, not person-by-person — only genuinely overlapping filenames prompt a decision:
  ```
  ⚠ john-doe/2026-02-10-technical-direction.md already exists and differs.
    Merge (keep both, second file renamed) / Skip (keep existing) / Overwrite (replace)?
  ```
  Choose once for the whole import, or per-file.

---

### `ladderline note delete`
Removes a single note file. Always asks for confirmation — no `--force` shortcut, given how costly losing evidence is.

```
ladderline note delete --person "John Doe" --date 2026-02-10 --tag technical-direction
⚠ This will permanently delete this note. Are you sure? (y/N)
```

---

### `ladderline untrack "<name>"`
Stops tracking a person. **Archives by default** — moves their folder to `archived/`, out of the dashboard and grid, but not destroyed. "Stopped tracking" and "this evidence never existed" are different intents, so archiving (not deleting) is the default.

```
ladderline untrack "Jan Kowalski"              # archives, recoverable
ladderline untrack "Jan Kowalski" --purge      # permanently deletes everything, asks twice
```

`--purge` matters for real deletion requests (e.g. GDPR-style) where archiving alone isn't sufficient.

---

### `ladderline ladder remove <file>`
Refuses if any tracked person is still assigned to that ladder, rather than silently orphaning them.

```
ladderline ladder remove senior-to-staff-eng.yaml
✗ 3 people are still assigned to senior-to-staff-eng.yaml — reassign them first, or use --force.
```

---

### `ladderline cycle remove <name>`
Lower risk — notes retain their `cycle` field as historical data regardless of whether the cycle definition still exists. Still warns if any notes reference the cycle being removed.

```
ladderline cycle remove 2026-Q1
```

---

### `ladderline help`
Lists all commands. Equivalent to running any command with no arguments.

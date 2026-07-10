# File and Folder Conventions

This page covers the **user's workspace** (created by `ladderline init`) — not the source code repo. Everything here is plain YAML/Markdown on disk; there is no database. See [[File-and-Folder-Conventions#why-plain-files]] below for why that's a deliberate choice.

## Workspace layout

```
ladderline/
├── config.yaml                          # workspace-level settings
├── cycles.yaml                          # all defined cycles (name, start, end)
├── ladders/
│   ├── senior-to-staff-eng.yaml
│   └── mid-to-senior-eng.yaml
├── john-doe/
│   ├── person.yaml                      # ladder assignment + relationship (--as)
│   ├── 2026-02-10-technical-direction.md
│   └── 2026-03-22-scope-of-impact.md
└── erika-mustermann/
    ├── person.yaml
    └── 2026-03-10-technical-direction.md
```

## Naming rules

| What | Rule | Example |
|---|---|---|
| Person folder name | kebab-case slug of the display name | `"John Doe"` → `john-doe/` |
| Note filename | `<date>-<tag>.md`; if a second note shares the same date+tag, append `-2`, `-3`, etc. | `2026-02-10-technical-direction.md`, `2026-02-10-technical-direction-2.md` |
| Tag IDs | kebab-case (see [[Naming-Conventions]]) | `technical-direction`, not `technical_direction` |
| Cycle names | `<year>-Q<n>` recommended, but any string is accepted | `2026-Q1` |

The **filename is a convenience for browsing on disk** — the frontmatter inside each file is the actual source of truth. Renaming a note file doesn't change what it means to Ladderline; editing its frontmatter does.

## File formats

### Ladder files (`.yaml`)

Pure structured data — no prose, so plain YAML is the cleanest fit.

```yaml
ladder: "Acme Corp — Senior to Staff Engineer"
competencies:
  - id: technical-direction
    name: "Technical Direction"
    current_level: "Makes sound decisions within their own system"
    next_level: "Sets technical direction others align to"
```

### `person.yaml` (one per tracked person)

```yaml
name: "John Doe"
ladder: senior-to-staff-eng.yaml
as: report
```

### Note files (`.md` with YAML frontmatter)

Mostly prose with a few structured fields stapled on top — the standard pattern used by Obsidian, Jekyll, and Hugo, chosen specifically so a note opens and reads naturally in any plain text editor, not just inside Ladderline.

```markdown
---
person: john-doe
tag: technical-direction
date: 2026-02-10
cycle: 2026-Q1
---
Pushed back on the caching design in the payments migration doc,
proposed the write-through approach, and 3 other teams adopted it
after her RFC review.
```

A note with no tag (a **notag**) simply omits the `tag` field entirely rather than setting it to an empty string or placeholder.

## Manual editing is explicitly supported

Hand-creating or hand-editing a note file — in Obsidian, in any text editor, however — is a first-class way to use Ladderline, not a workaround. The tool reads any `.md` file with valid frontmatter in a person's folder, regardless of how it was created.

Malformed hand-edits (a missing field, a typo'd tag) must **surface as a visible warning, never silently disappear** from the dashboard or a case — consistent with the error-handling principle in [[Error-Handling]]:

```
⚠ john-doe/2026-02-10-technical-direction.md has an unrecognized tag
  "technica-direction". Did you mean: technical-direction?
```

## Deleting files manually needs no explicit resync

Because nothing is cached as a second source of truth, there's nothing to desync. The dashboard, `case`, `notag list`, and the Team grid all read straight off disk on every run — a manually deleted note simply isn't there on the next read.

The one exception is the small staleness index behind the Tier 1 nudges — it self-validates on every read (a fast per-entry existence check, not a full re-parse) and silently drops any entry pointing at a file that no longer exists. This only affects the nudge signal; the dashboard and case output never depend on that cache, so a bug there could at worst make a nudge briefly wrong, never cause a case to include deleted evidence.

If a note is deleted while the dashboard is already open in a browser tab, the currently-rendered page doesn't auto-update (no live file-watcher in v1) — re-navigating or hitting Refresh shows the current state immediately. A real file-watcher is a reasonable v1.5 nicety, not a v1 requirement.

## Why plain files

No database, no server, no account. Everything is git-friendly, grep-able, and portable — an EM can back up or version their workspace with `git init` inside `./ladderline/` if they want history, with zero extra tooling from Ladderline itself. This also means there's never an export format to design or a risk of the project going unmaintained and trapping someone's data.

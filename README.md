# Ladderline

**Track career-ladder evidence, locally, as it happens.**

Every engineering manager knows the feeling: promo season arrives, and you're trying to reconstruct six months of a report's growth from memory, old Slack messages, and a vague sense that *something* good happened in March. Ladderline fixes that by giving you a place to jot a two-line note the moment something evidence-worthy happens — tagged against your team's actual career ladder — so a real, dated record builds itself quietly all year. When it's time to write the case, you're assembling, not remembering.

- **Local-first.** Everything lives in plain YAML/Markdown files on your machine — no server, no account, no database, nothing to trust with sensitive people-data but yourself.
- **Never invents.** Cases are assembled only from what you actually logged. Gaps are shown honestly, not smoothed over.
- **Plain files, no lock-in.** Notes are Markdown with YAML frontmatter — open them in any text editor, or Obsidian, or grep them. Nothing about this tool traps your data.

## Install

```bash
npm install -g @umbrova/ladderline
```

Or try it without installing anything:

```bash
npx @umbrova/ladderline init
```

## Quick start

```bash
# Create a workspace in the current folder
ladderline init

# Define a review period
ladderline cycle add 2026-Q1 --start 2026-01-01 --end 2026-03-31

# Start tracking someone against the bundled default ladder
ladderline track "Sarah Chen" --ladder generic-ic-ladder.yaml --as report

# Log evidence the moment something happens — takes 10 seconds
ladderline note "Pushed back on the caching design, adopted by 3 teams" \
  --person "Sarah Chen" --tag technical-direction --date 2026-02-10

# See it all in the local dashboard
ladderline dashboard

# When review time comes, assemble a case from everything you logged
ladderline case "Sarah Chen" --cycle 2026-Q1
```

That last command writes `./cases/2026-Q1/sarah-chen.docx` — a structured brief grouped by competency, every line traceable to a dated note you actually wrote, with any competency that has zero evidence shown honestly rather than glossed over.

## What it's for

- **Tracking direct reports** heading toward a promotion
- **Your own case**, if you're building evidence for your own next level
- **Peer or 360 contributions** — logging what you noticed about someone outside your reporting line, for when their manager asks

Track anyone with `--as report | self | mentee | cross-team | peer` — the mechanism is the same regardless of the relationship.

## Commands

| Command | What it does |
|---|---|
| `ladderline init` | Create a new workspace in the current folder |
| `ladderline ladder list` | Show ladders registered in this workspace |
| `ladderline ladder add <file>` | Register a ladder file |
| `ladderline ladder remove <file> [--force]` | Remove a registered ladder |
| `ladderline track <name> --ladder <file> --as <relationship>` | Start tracking a person |
| `ladderline untrack <name> [--purge]` | Stop tracking (archives by default; `--purge` permanently deletes, asks you to type the name to confirm) |
| `ladderline note <text> --person <name> [--tag <id> \| --notag] [--date <date>]` | Log a single evidence note |
| `ladderline note-delete --person <name> --date <date> [--tag <id> \| --notag] [--filename <name>]` | Delete a single note (always asks to confirm) |
| `ladderline cycle add <name> --start <date> --end <date>` | Define a review period |
| `ladderline cycle list` | Show defined cycles |
| `ladderline cycle remove <name>` | Remove a defined cycle |
| `ladderline case [name] --cycle <name> [--format docx\|md] [--all] [--as <relationship>] [--prompt]` | Assemble a case — one person, or `--all` for everyone |
| `ladderline notag list [--person <name>]` | List notes not yet mapped to a competency |
| `ladderline export [--person <name>] [--cycle <name>] [--since <date>]` | Zip the workspace, or a filtered slice of it |
| `ladderline import <file.zip> [--force]` | Restore or merge a workspace from an export |
| `ladderline dashboard [--port <port>]` | Launch the local web dashboard |

Every command supports `--help`. Full details, file formats, and conventions live in the [wiki](../../wiki).

## Known limitations (v0.1)

- **No sample/demo data yet.** `init` accepts a `--demo` flag, but seeding a realistic demo workspace isn't implemented yet — it currently just prints a note saying so. A separate standalone `ladderline demo` command (a fully throwaway workspace) was planned but hasn't been built either. Both are reasonable follow-ups, not blockers for real use.

## The dashboard

`ladderline dashboard` starts a local web server (default `http://localhost:4200`, reachable only on your machine) with four views:

- **Person** — one person at a time, each competency as a row, with note counts and how fresh the evidence is
- **Team grid** — everyone at a glance, competencies as columns, for spotting gaps before calibration
- **Notes** — every logged note, filterable and expandable to its raw file
- **Insights** — coverage percentage, what's going stale, your own logging cadence, and cycle readiness

A small badge in the top bar surfaces when something needs attention — the same signal also shows up as a one-line nudge before any command's output, right in your terminal.

## Why plain files

Every note is Markdown with YAML frontmatter:

```markdown
---
person: sarah-chen
tag: technical-direction
date: 2026-02-10
cycle: 2026-Q1
---
Pushed back on the caching design in the payments migration doc,
proposed the write-through approach, and 3 other teams adopted it
after her RFC review.
```

You can write these by hand — in Obsidian, in any editor, however you like. Ladderline doesn't care how a note was created, only that it's a valid file in the right place. Full conventions are documented in the [wiki](../../wiki).

## Feedback

- Bugs or ideas → [Issues](../../issues) or [Discussions](../../discussions)
- See [CONTRIBUTING.md](./CONTRIBUTING.md) for how the codebase is organized

No telemetry, ever — nothing about your usage leaves your machine.

## License

MIT — see [LICENSE](./LICENSE).
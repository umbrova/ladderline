# Changelog

All notable changes to Ladderline are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and versioning follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- `init` — create a workspace, with `--demo` seeding a realistic demo person and one deliberate evidence gap
- `ladder add` / `list` / `remove` — manage career ladder files, with a bundled default ladder
- `track` / `untrack` — start tracking a person (report, self, mentee, cross-team, or peer); `untrack` archives by default, `--purge` deletes permanently
- `note` / `note-delete` — log and delete evidence entries, always confirming before deletion
- `cycle add` / `list` / `remove` — define named review periods
- `case` — assemble a case for one person or `--all` tracked people, in docx or markdown, with an optional `--prompt` for LLM handoff
- `notag list` — review evidence not yet mapped to a competency
- `export` / `import` — back up or share a workspace (or a filtered slice of it) as a zip
- `dashboard` — local web UI with Person, Team grid, Notes, Insights, and Docs tabs
- Tier 1 nudges — a one-line staleness reminder before any command's output, and a matching dashboard badge
- Full test suite (99 tests) covering every core module and the dashboard's API

### Design principles
- Never invents or summarizes evidence — everything in a case traces back to a note you actually logged
- Fully local — plain YAML/Markdown files, no server, no database, no telemetry
- Gaps are shown honestly, never smoothed over

[Unreleased]: https://github.com/umbrova/ladderline/compare/main...HEAD
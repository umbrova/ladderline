# Ladderline Wiki

Ladderline is an open source, local-first tool for engineering managers to log evidence of a report's (or their own) growth against a career ladder, and generate a grounded case at review time.

This wiki is the reference for every convention the project follows — naming, file formats, CLI behavior, and error handling — so contributors and users don't have to reverse-engineer it from the source.

## Pages

- **[[Terminology]]** — the project's fixed vocabulary (ladder, tag, note, notag, case, cycle, dashboard)
- **[[CLI-Reference]]** — every command, its flags, and examples
- **[[File-and-Folder-Conventions]]** — workspace layout, filenames, and file formats

## Core principle

Everything in Ladderline follows one rule: **never invent, never lose evidence.** Notes are never auto-generated or summarized by AI. Cases are assembled only from what was actually logged, with every line traceable to a dated source. Gaps are shown honestly rather than smoothed over. This principle is why several conventions in this wiki exist — when in doubt about how to extend the tool, this is the test to apply.

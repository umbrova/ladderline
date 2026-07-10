# Naming Conventions

## Kebab-case, everywhere an identifier is typed

Tag IDs, `--as` values, person-folder slugs, command names, and flag names all use kebab-case (`technical-direction`, `cross-team`, `john-doe`) — never snake_case or camelCase.

This was a deliberate fix: tags originally used snake_case (`technical_direction`) while `--as` values were already kebab-case (`cross-team`), which meant the same CLI used two different conventions depending on which identifier you were typing. Kebab-case won because:

- It matches general CLI/flag convention across the Node ecosystem (`--dry-run`, `--no-cache`)
- It reads slightly lighter than underscores, which can look more "code-like" than necessary to someone skimming a ladder file
- YAML keys, filenames, and shell arguments all handle hyphens exactly as well as underscores, so there's no functional tradeoff

## Human-readable names live separately from IDs

The kebab-case ID (`technical-direction`) is only ever typed or stored. Anywhere a person actually *reads* a tag — the dashboard, a generated case, the tag dropdown in the note form — it shows the ladder's `name` field ("Technical Direction") instead. Casing conventions are about typing comfort and internal consistency, not about how output looks to someone reviewing a case.

## Command and package naming

- CLI verbs are single words wherever possible (`track`, `note`, `case`), matching the [[Terminology]] glossary exactly — never a synonym.
- Product name: **Ladderline**. Package: `@umbrova/ladderline` (npm, scoped). Repo: `github.com/umbrova/ladderline`.

## Do not introduce parallel vocabulary

If a new feature needs a name, check [[Terminology]] first. Reusing an existing word in a new context (like `notag` reusing `tag`) is preferred over coining an unrelated new term.

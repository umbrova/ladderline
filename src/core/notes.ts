import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { load as parseYaml, dump as dumpYaml } from "js-yaml";
import { isTracked, loadPerson, slugify, listTrackedPeople } from "./people.js";
import { loadLadder, getValidTags } from "./ladder.js";
import { findCycleForDate } from "./cycles.js";
import { PersonNotTrackedError, MissingTagError, InvalidTagError, NoteNotFoundError, AmbiguousNoteError } from "./errors.js";

export interface NoteFrontmatter {
  person: string;
  tag?: string;
  date: string;
  cycle?: string;
}

export interface NoteOptions {
  tag?: string;
  notag?: boolean;
  date?: string;
  text: string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addNote(
  workspacePath: string,
  personName: string,
  options: NoteOptions
): { path: string; warning?: string } {
  if (!isTracked(workspacePath, personName)) {
    throw new PersonNotTrackedError(personName);
  }

  if (!options.tag && !options.notag) {
    throw new MissingTagError();
  }

  if (options.tag) {
    const person = loadPerson(workspacePath, personName);
    const ladder = loadLadder(workspacePath, person.ladder);
    const validTags = getValidTags(ladder);
    if (!validTags.includes(options.tag)) {
      throw new InvalidTagError(options.tag, validTags);
    }
  }

  const date = options.date ?? today();
  const cycle = findCycleForDate(workspacePath, date);
  const warning = cycle
    ? undefined
    : `No defined cycle covers ${date} — note saved without a cycle. Run: ladderline cycle add <name> --start <date> --end <date>`;

  const personDir = join(workspacePath, slugify(personName));
  mkdirSync(personDir, { recursive: true });

  const tagPart = options.tag ?? "notag";
  let filename = `${date}-${tagPart}.md`;
  let counter = 2;
  while (existsSync(join(personDir, filename))) {
    filename = `${date}-${tagPart}-${counter}.md`;
    counter++;
  }

  const frontmatter: NoteFrontmatter = {
    person: slugify(personName),
    date,
    ...(options.tag ? { tag: options.tag } : {}),
    ...(cycle ? { cycle } : {}),
  };

  const content = `---\n${dumpYaml(frontmatter)}---\n${options.text}\n`;
  const filePath = join(personDir, filename);
  writeFileSync(filePath, content);

  return { path: filePath, warning };
}

export function listAllNotes(
  workspacePath: string,
  filters: { person?: string; tag?: string; cycle?: string; notagOnly?: boolean }
): Array<{ personName: string; filename: string; frontmatter: NoteFrontmatter; body: string }> {
  const targets = filters.person
    ? [filters.person]
    : listTrackedPeople(workspacePath).map((p) => p.record.name);

  const result: Array<{ personName: string; filename: string; frontmatter: NoteFrontmatter; body: string }> = [];
  for (const name of targets) {
    for (const note of listNotes(workspacePath, name)) {
      if (filters.tag && note.frontmatter.tag !== filters.tag) continue;
      if (filters.cycle && note.frontmatter.cycle !== filters.cycle) continue;
      if (filters.notagOnly && note.frontmatter.tag) continue;
      result.push({ personName: name, ...note });
    }
  }

  return result.sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date));
}

/**
 * Notes without a tag, either for one person or across everyone tracked.
 * This is the same underlying data as the dashboard's "Notes" tab
 * filtered to tag: none — one implementation, not two.
 */
export function listNotagNotes(
  workspacePath: string,
  personName?: string
): Array<{ personName: string; filename: string; frontmatter: NoteFrontmatter; body: string }> {
  return listAllNotes(workspacePath, { person: personName, notagOnly: true });
}

export function listNotes(
  workspacePath: string,
  personName: string
): Array<{ filename: string; frontmatter: NoteFrontmatter; body: string }> {
  const personDir = join(workspacePath, slugify(personName));
  if (!existsSync(personDir)) return [];

  return readdirSync(personDir)
    .filter((f) => f.endsWith(".md"))
    .map((filename) => {
      const raw = readFileSync(join(personDir, filename), "utf-8");
      const [, frontmatterRaw, ...bodyParts] = raw.split("---\n");
      const frontmatter = parseYaml(frontmatterRaw) as NoteFrontmatter;
      return { filename, frontmatter, body: bodyParts.join("---\n").trim() };
    });
}

export function findMatchingNotes(
  workspacePath: string,
  personName: string,
  options: { tag?: string; notag?: boolean; date: string }
): Array<{ filename: string; frontmatter: NoteFrontmatter; body: string }> {
  return listNotes(workspacePath, personName).filter((n) => {
    if (n.frontmatter.date !== options.date) return false;
    if (options.notag) return !n.frontmatter.tag;
    return n.frontmatter.tag === options.tag;
  });
}

export function deleteNote(
  workspacePath: string,
  personName: string,
  options: { tag?: string; notag?: boolean; date: string; filename?: string }
): string {
  if (!isTracked(workspacePath, personName)) {
    throw new PersonNotTrackedError(personName);
  }

  const personDir = join(workspacePath, slugify(personName));

  if (options.filename) {
    const path = join(personDir, options.filename);
    if (!existsSync(path)) throw new NoteNotFoundError(personName);
    unlinkSync(path);
    return path;
  }

  const matches = findMatchingNotes(workspacePath, personName, {
    tag: options.tag,
    notag: options.notag,
    date: options.date,
  });

  if (matches.length === 0) throw new NoteNotFoundError(personName);
  if (matches.length > 1) {
    throw new AmbiguousNoteError(personName, matches.map((m) => m.filename));
  }

  const path = join(personDir, matches[0].filename);
  unlinkSync(path);
  return path;
}



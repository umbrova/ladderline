import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { load as parseYaml, dump as dumpYaml } from "js-yaml";
import { isTracked, loadPerson, slugify } from "./people.js";
import { loadLadder, getValidTags } from "./ladder.js";
import { findCycleForDate } from "./cycles.js";
import { PersonNotTrackedError, MissingTagError, InvalidTagError } from "./errors.js";

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

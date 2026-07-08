import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";
import { load as parseYaml, dump as dumpYaml } from "js-yaml";
import { PersonAlreadyTrackedError, PersonNotTrackedError, InvalidRelationshipError, LadderNotFoundError } from "./errors.js";
import { listLadders } from "./ladder.js";

export const VALID_RELATIONSHIPS = ["report", "self", "mentee", "cross-team", "peer"] as const;
export type Relationship = (typeof VALID_RELATIONSHIPS)[number];

export interface PersonRecord {
  name: string;
  ladder: string;
  as: Relationship;
}

export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isTracked(workspacePath: string, name: string): boolean {
  return existsSync(join(workspacePath, slugify(name), "person.yaml"));
}

export function trackPerson(
  workspacePath: string,
  name: string,
  options: { ladder: string; as: string }
): string {
  if (isTracked(workspacePath, name)) {
    throw new PersonAlreadyTrackedError(name);
  }

  if (!VALID_RELATIONSHIPS.includes(options.as as Relationship)) {
    throw new InvalidRelationshipError(options.as, [...VALID_RELATIONSHIPS]);
  }

  const registeredLadders = listLadders(workspacePath);
  if (!registeredLadders.includes(options.ladder)) {
    throw new LadderNotFoundError(options.ladder, registeredLadders);
  }

  const slug = slugify(name);
  const personDir = join(workspacePath, slug);
  mkdirSync(personDir, { recursive: true });

  const record: PersonRecord = { name, ladder: options.ladder, as: options.as as Relationship };
  writeFileSync(join(personDir, "person.yaml"), dumpYaml(record));

  return slug;
}

export function loadPerson(workspacePath: string, name: string): PersonRecord {
  return loadPersonBySlug(workspacePath, slugify(name));
}

export function loadPersonBySlug(workspacePath: string, slug: string): PersonRecord {
  const path = join(workspacePath, slug, "person.yaml");
  const raw = readFileSync(path, "utf-8");
  return parseYaml(raw) as PersonRecord;
}

/** Every currently tracked person in this workspace — used by bulk case generation. */
export function listTrackedPeople(
  workspacePath: string
): Array<{ slug: string; record: PersonRecord }> {
  return readdirSync(workspacePath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "ladders" && entry.name !== "archived")
    .filter((entry) => existsSync(join(workspacePath, entry.name, "person.yaml")))
    .map((entry) => ({ slug: entry.name, record: loadPersonBySlug(workspacePath, entry.name) }));
}

export function archivePerson(workspacePath: string, name: string): void {
  if (!isTracked(workspacePath, name)) {
    throw new PersonNotTrackedError(name);
  }
  const slug = slugify(name);
  mkdirSync(join(workspacePath, "archived"), { recursive: true });
  renameSync(join(workspacePath, slug), join(workspacePath, "archived", slug));
}

export function purgePerson(workspacePath: string, name: string): void {
  const slug = slugify(name);
  const activePath = join(workspacePath, slug);
  const archivedPath = join(workspacePath, "archived", slug);

  if (existsSync(join(activePath, "person.yaml"))) {
    rmSync(activePath, { recursive: true, force: true });
  } else if (existsSync(join(archivedPath, "person.yaml"))) {
    rmSync(archivedPath, { recursive: true, force: true });
  } else {
    throw new PersonNotTrackedError(name);
  }
}
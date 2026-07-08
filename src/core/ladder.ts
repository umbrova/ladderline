import { existsSync, readdirSync, readFileSync, copyFileSync, unlinkSync } from "node:fs";
import { join, basename } from "node:path";
import { load as parseYaml } from "js-yaml";
import {
  InvalidLadderFileError,
  LadderAlreadyExistsError,
  LadderNotFoundError,
  LadderInUseError,
} from "./errors.js";
import { listTrackedPeople } from "./people.js";

export interface Competency {
  id: string;
  name: string;
  current_level: string;
  next_level: string;
}

export interface Ladder {
  ladder: string;
  competencies: Competency[];
}

export function listLadders(workspacePath: string): string[] {
  const laddersDir = join(workspacePath, "ladders");
  if (!existsSync(laddersDir)) return [];
  return readdirSync(laddersDir).filter((f) => f.endsWith(".yaml"));
}

function validateLadderShape(data: unknown, sourcePath: string): asserts data is Ladder {
  if (typeof data !== "object" || data === null) {
    throw new InvalidLadderFileError(sourcePath, "the file isn't a YAML object");
  }
  const d = data as Record<string, unknown>;

  if (typeof d.ladder !== "string" || d.ladder.trim() === "") {
    throw new InvalidLadderFileError(sourcePath, `missing a "ladder" name`);
  }
  if (!Array.isArray(d.competencies) || d.competencies.length === 0) {
    throw new InvalidLadderFileError(sourcePath, `missing a "competencies" list`);
  }
  for (const c of d.competencies) {
    if (typeof c !== "object" || c === null || typeof (c as any).id !== "string") {
      throw new InvalidLadderFileError(
        sourcePath,
        `every competency needs an "id" (found one without a valid id)`
      );
    }
    if (typeof (c as any).name !== "string") {
      throw new InvalidLadderFileError(
        sourcePath,
        `competency "${(c as any).id}" is missing a "name"`
      );
    }
  }
}

function safeParseYaml(raw: string, sourcePath: string): unknown {
  try {
    return parseYaml(raw);
  } catch (err) {
    const reason = err instanceof Error ? err.message.split("\n")[0] : "invalid YAML syntax";
    throw new InvalidLadderFileError(sourcePath, reason);
  }
}

export function addLadder(workspacePath: string, sourceFilePath: string): string {
  const raw = readFileSync(sourceFilePath, "utf-8");
  const parsed = safeParseYaml(raw, sourceFilePath);
  validateLadderShape(parsed, sourceFilePath);

  const filename = basename(sourceFilePath);
  const destPath = join(workspacePath, "ladders", filename);

  if (existsSync(destPath)) {
    throw new LadderAlreadyExistsError(filename);
  }

  copyFileSync(sourceFilePath, destPath);
  return filename;
}

export function loadLadder(workspacePath: string, filename: string): Ladder {
  const path = join(workspacePath, "ladders", filename);
  if (!existsSync(path)) {
    throw new LadderNotFoundError(filename, listLadders(workspacePath));
  }
  const raw = readFileSync(path, "utf-8");
  const parsed = safeParseYaml(raw, path);
  validateLadderShape(parsed, path);
  return parsed;
}

export function getValidTags(ladder: Ladder): string[] {
  return ladder.competencies.map((c) => c.id);
}

export function removeLadder(
  workspacePath: string,
  filename: string,
  options: { force?: boolean }
): void {
  if (!listLadders(workspacePath).includes(filename)) {
    throw new LadderNotFoundError(filename, listLadders(workspacePath));
  }

  const assigned = listTrackedPeople(workspacePath).filter((p) => p.record.ladder === filename);

  if (assigned.length > 0 && !options.force) {
    throw new LadderInUseError(filename, assigned.map((p) => p.record.name));
  }

  unlinkSync(join(workspacePath, "ladders", filename));
}
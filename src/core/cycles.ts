import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { load as parseYaml, dump as dumpYaml } from "js-yaml";
import { CycleAlreadyExistsError, InvalidDateRangeError, CycleNotFoundError } from "./errors.js";
import { listTrackedPeople } from "./people.js";
import { listNotes } from "./notes.js";

export interface CycleRecord {
  name: string;
  start: string;
  end: string;
}

interface CyclesFile {
  cycles: CycleRecord[];
}

function cyclesPath(workspacePath: string): string {
  return join(workspacePath, "cycles.yaml");
}

export function listCycles(workspacePath: string): CycleRecord[] {
  const path = cyclesPath(workspacePath);
  if (!existsSync(path)) return [];
  const data = parseYaml(readFileSync(path, "utf-8")) as CyclesFile;
  return data.cycles ?? [];
}

export function addCycle(workspacePath: string, name: string, start: string, end: string): void {
  if (start > end) {
    throw new InvalidDateRangeError(start, end);
  }
  const existing = listCycles(workspacePath);
  if (existing.some((c) => c.name === name)) {
    throw new CycleAlreadyExistsError(name);
  }
  existing.push({ name, start, end });
  writeFileSync(cyclesPath(workspacePath), dumpYaml({ cycles: existing }));
}

export function findCycleForDate(workspacePath: string, date: string): string | undefined {
  const cycles = listCycles(workspacePath);
  const match = cycles.find((c) => date >= c.start && date <= c.end);
  return match?.name;
}

export function removeCycle(workspacePath: string, name: string): { warning?: string } {
  const cycles = listCycles(workspacePath);
  if (!cycles.some((c) => c.name === name)) {
    throw new CycleNotFoundError(name, cycles.map((c) => c.name));
  }

  let referencingCount = 0;
  for (const person of listTrackedPeople(workspacePath)) {
    referencingCount += listNotes(workspacePath, person.record.name).filter(
      (n) => n.frontmatter.cycle === name
    ).length;
  }

  const remaining = cycles.filter((c) => c.name !== name);
  writeFileSync(join(workspacePath, "cycles.yaml"), dumpYaml({ cycles: remaining }));

  return referencingCount > 0
    ? { warning: `${referencingCount} note(s) still reference cycle "${name}" — they keep it as historical data.` }
    : {};
}

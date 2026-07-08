import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { load as parseYaml, dump as dumpYaml } from "js-yaml";
import { CycleAlreadyExistsError, InvalidDateRangeError } from "./errors.js";

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

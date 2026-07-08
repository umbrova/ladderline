import { findWorkspaceRoot } from "../core/workspace.js";
import { addCycle, listCycles, removeCycle } from "../core/cycles.js";
import { LadderlineError } from "../core/errors.js";

function handleError(err: unknown): void {
  if (err instanceof LadderlineError) {
    console.error(`✗ ${err.message}`);
    if (err.suggestion) console.error(`  ${err.suggestion}`);
    process.exitCode = 1;
    return;
  }
  throw err;
}

export function runCycleAdd(name: string, options: { start: string; end: string }): void {
  try {
    const workspace = findWorkspaceRoot();
    addCycle(workspace, name, options.start, options.end);
    console.log(`✓ Defined cycle ${name} (${options.start} to ${options.end})`);
  } catch (err) {
    handleError(err);
  }
}

export function runCycleList(): void {
  try {
    const workspace = findWorkspaceRoot();
    const cycles = listCycles(workspace);
    if (cycles.length === 0) {
      console.log("No cycles defined yet. Run: ladderline cycle add <name> --start <date> --end <date>");
      return;
    }
    console.log("Defined cycles:");
    for (const c of cycles) console.log(`  - ${c.name} (${c.start} to ${c.end})`);
  } catch (err) {
    handleError(err);
  }
}

export function runCycleRemove(name: string): void {
  try {
    const workspace = findWorkspaceRoot();
    const result = removeCycle(workspace, name);
    console.log(`✓ Removed cycle: ${name}`);
    if (result.warning) console.warn(`⚠ ${result.warning}`);
  } catch (err) {
    handleError(err);
  }
}
import { findWorkspaceRoot } from "../core/workspace.js";
import { addCycle, listCycles, removeCycle } from "../core/cycles.js";
import { printSuccess, printWarning, printErrorAndSetExitCode } from "./output.js";

export function runCycleAdd(name: string, options: { start: string; end: string }): void {
  try {
    const workspace = findWorkspaceRoot();
    addCycle(workspace, name, options.start, options.end);
    printSuccess(`Defined cycle ${name} (${options.start} to ${options.end})`);
  } catch (err) {
    printErrorAndSetExitCode(err);
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
    printErrorAndSetExitCode(err);
  }
}

export function runCycleRemove(name: string): void {
  try {
    const workspace = findWorkspaceRoot();
    const result = removeCycle(workspace, name);
    printSuccess(`Removed cycle: ${name}`);
    if (result.warning) printWarning(result.warning);
  } catch (err) {
    printErrorAndSetExitCode(err);
  }
}
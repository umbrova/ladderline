import { findWorkspaceRoot } from "../core/workspace.js";
import { listLadders, addLadder, removeLadder } from "../core/ladder.js";
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

export function runLadderList(): void {
  try {
    const workspace = findWorkspaceRoot();
    const ladders = listLadders(workspace);
    if (ladders.length === 0) {
      console.log("No ladders registered yet. Run: ladderline ladder add <file.yaml>");
      return;
    }
    console.log("Registered ladders:");
    for (const l of ladders) console.log(`  - ${l}`);
  } catch (err) {
    handleError(err);
  }
}

export function runLadderAdd(filePath: string): void {
  try {
    const workspace = findWorkspaceRoot();
    const filename = addLadder(workspace, filePath);
    console.log(`✓ Registered ladder: ${filename}`);
  } catch (err) {
    handleError(err);
  }
}

export function runLadderRemove(filename: string, options: { force?: boolean }): void {
  try {
    const workspace = findWorkspaceRoot();
    removeLadder(workspace, filename, options);
    console.log(`✓ Removed ladder: ${filename}`);
  } catch (err) {
    handleError(err);
  }
}

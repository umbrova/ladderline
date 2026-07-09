import { findWorkspaceRoot } from "../core/workspace.js";
import { listLadders, addLadder, removeLadder } from "../core/ladder.js";
import { printSuccess, printErrorAndSetExitCode } from "./output.js";

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
    printErrorAndSetExitCode(err);
  }
}

export function runLadderAdd(filePath: string): void {
  try {
    const workspace = findWorkspaceRoot();
    const filename = addLadder(workspace, filePath);
    printSuccess(`Registered ladder: ${filename}`);
  } catch (err) {
    printErrorAndSetExitCode(err);
  }
}

export function runLadderRemove(filename: string, options: { force?: boolean }): void {
  try {
    const workspace = findWorkspaceRoot();
    removeLadder(workspace, filename, options);
    printSuccess(`Removed ladder: ${filename}`);
  } catch (err) {
    printErrorAndSetExitCode(err);
  }
}
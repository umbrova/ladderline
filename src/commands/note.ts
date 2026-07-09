import { findWorkspaceRoot } from "../core/workspace.js";
import { addNote } from "../core/notes.js";
import { printSuccess, printWarning, printErrorAndSetExitCode } from "./output.js";

export function runNote(
  personName: string,
  text: string,
  options: { tag?: string; notag?: boolean; date?: string }
): void {
  try {
    const workspace = findWorkspaceRoot();
    const result = addNote(workspace, personName, { ...options, text });
    printSuccess(`Note saved: ${result.path}`);
    if (result.warning) printWarning(result.warning);
  } catch (err) {
    printErrorAndSetExitCode(err);
  }
}
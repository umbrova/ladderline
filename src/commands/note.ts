import { findWorkspaceRoot } from "../core/workspace.js";
import { addNote } from "../core/notes.js";
import { LadderlineError } from "../core/errors.js";

export function runNote(
  personName: string,
  text: string,
  options: { tag?: string; notag?: boolean; date?: string }
): void {
  try {
    const workspace = findWorkspaceRoot();
    const result = addNote(workspace, personName, { ...options, text });
    console.log(`✓ Note saved: ${result.path}`);
    if (result.warning) console.warn(`⚠ ${result.warning}`);
  } catch (err) {
    if (err instanceof LadderlineError) {
      console.error(`✗ ${err.message}`);
      if (err.suggestion) console.error(`  ${err.suggestion}`);
      process.exitCode = 1;
      return;
    }
    throw err;
  }
}

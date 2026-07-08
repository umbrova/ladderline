import { findWorkspaceRoot } from "../core/workspace.js";
import { deleteNote } from "../core/notes.js";
import { confirm } from "./prompt.js";
import { LadderlineError } from "../core/errors.js";

export async function runNoteDelete(
  personName: string,
  options: { tag?: string; notag?: boolean; date: string; filename?: string }
): Promise<void> {
  try {
    const workspace = findWorkspaceRoot();

    const ok = await confirm(`This will permanently delete this note. Are you sure?`);
    if (!ok) {
      console.log("Aborted, nothing changed.");
      return;
    }

    const path = deleteNote(workspace, personName, options);
    console.log(`✓ Deleted: ${path}`);
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
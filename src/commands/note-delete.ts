import { findWorkspaceRoot } from "../core/workspace.js";
import { deleteNote } from "../core/notes.js";
import { confirm } from "./prompt.js";
import { printSuccess, printErrorAndSetExitCode } from "./output.js";

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
    printSuccess(`Deleted: ${path}`);
  } catch (err) {
    printErrorAndSetExitCode(err);
  }
}
import { findWorkspaceRoot } from "../core/workspace.js";
import { archivePerson, purgePerson } from "../core/people.js";
import { confirmByTyping } from "./prompt.js";
import { printSuccess, printErrorAndSetExitCode } from "./output.js";

export async function runUntrack(name: string, options: { purge?: boolean }): Promise<void> {
  try {
    const workspace = findWorkspaceRoot();

    if (!options.purge) {
      archivePerson(workspace, name);
      printSuccess(`Archived "${name}" — recoverable under archived/, run with --purge to delete permanently.`);
      return;
    }

    const confirmed = await confirmByTyping(
      `This will PERMANENTLY delete all data for "${name}" — this cannot be undone.\nType "${name}" to confirm:`,
      name
    );
    if (!confirmed) {
      console.log("Aborted, nothing changed.");
      return;
    }

    purgePerson(workspace, name);
    printSuccess(`Permanently deleted all data for "${name}".`);
  } catch (err) {
    printErrorAndSetExitCode(err);
  }
}
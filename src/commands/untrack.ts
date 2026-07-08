import { findWorkspaceRoot } from "../core/workspace.js";
import { archivePerson, purgePerson } from "../core/people.js";
import { confirmByTyping } from "./prompt.js";
import { LadderlineError } from "../core/errors.js";

export async function runUntrack(name: string, options: { purge?: boolean }): Promise<void> {
  try {
    const workspace = findWorkspaceRoot();

    if (!options.purge) {
      archivePerson(workspace, name);
      console.log(`✓ Archived "${name}" — recoverable under archived/, run with --purge to delete permanently.`);
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
    console.log(`✓ Permanently deleted all data for "${name}".`);
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
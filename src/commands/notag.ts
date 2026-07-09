import { findWorkspaceRoot } from "../core/workspace.js";
import { listNotagNotes } from "../core/notes.js";
import { printErrorAndSetExitCode } from "./output.js";

export function runNotagList(options: { person?: string }): void {
  try {
    const workspace = findWorkspaceRoot();
    const notes = listNotagNotes(workspace, options.person);

    if (notes.length === 0) {
      console.log("No notag entries found.");
      return;
    }

    console.log(`${notes.length} notag entr${notes.length === 1 ? "y" : "ies"}:`);
    for (const n of notes) {
      const snippet = n.body.length > 60 ? n.body.slice(0, 60) + "…" : n.body;
      console.log(`  - [${n.frontmatter.date}] ${n.personName}: "${snippet}"`);
    }
  } catch (err) {
    printErrorAndSetExitCode(err);
  }
}
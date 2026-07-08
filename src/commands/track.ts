import { findWorkspaceRoot } from "../core/workspace.js";
import { trackPerson } from "../core/people.js";
import { LadderlineError } from "../core/errors.js";

export function runTrack(name: string, options: { ladder: string; as: string }): void {
  try {
    const workspace = findWorkspaceRoot();
    trackPerson(workspace, name, options);
    console.log(`✓ Now tracking "${name}" (${options.as}) against ${options.ladder}`);
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

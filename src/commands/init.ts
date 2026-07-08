import { createWorkspace } from "../core/workspace.js";
import { LadderlineError } from "../core/errors.js";

export function runInit(options: { demo?: boolean }): void {
  try {
    const path = createWorkspace(process.cwd());
    console.log(`✓ Created workspace at ${path}`);
    console.log(`✓ Added default ladder: generic-ic-ladder.yaml`);

    if (options.demo) {
      console.log(`ℹ --demo seeding arrives once the track/note commands exist (Phase 3–4)`);
    }
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

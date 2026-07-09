import { createWorkspace } from "../core/workspace.js";
import { seedDemoData } from "../core/demo.js";
import { LadderlineError } from "../core/errors.js";

export function runInit(options: { demo?: boolean }): void {
  try {
    const path = createWorkspace(process.cwd());
    console.log(`✓ Created workspace at ${path}`);
    console.log(`✓ Added default ladder: generic-ic-ladder.yaml`);

    if (options.demo) {
      seedDemoData(path);
      console.log(`✓ Seeded demo data: "Sam Example" with 3 notes (and one deliberate gap)`);
    }

    console.log(`
Next steps:
  1. ladderline track "Name" --ladder generic-ic-ladder.yaml --as report
  2. ladderline note "what happened" --person "Name" --tag <competency-id>
  3. ladderline dashboard`);
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
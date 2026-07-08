import { importZip } from "../core/import.js";
import { LadderlineError } from "../core/errors.js";

export function runImport(zipPath: string, options: { force?: boolean }): void {
  try {
    const result = importZip(process.cwd(), zipPath, options);

    if (result.createdFreshWorkspace) {
      console.log(`✓ Created a new workspace from ${zipPath} (${result.imported.length} files)`);
      return;
    }

    console.log(`✓ Merged ${result.imported.length} file(s) into the existing workspace`);
    if (result.skippedConflicts.length > 0) {
      console.warn(`⚠ ${result.skippedConflicts.length} file(s) skipped (already exist with different content):`);
      for (const f of result.skippedConflicts) console.warn(`    - ${f}`);
      console.warn(`  Re-run with --force to overwrite them.`);
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

import { importZip } from "../core/import.js";
import { printSuccess, printWarning, printErrorAndSetExitCode } from "./output.js";

export function runImport(zipPath: string, options: { force?: boolean }): void {
  try {
    const result = importZip(process.cwd(), zipPath, options);

    if (result.createdFreshWorkspace) {
      printSuccess(`Created a new workspace from ${zipPath} (${result.imported.length} files)`);
      return;
    }

    printSuccess(`Merged ${result.imported.length} file(s) into the existing workspace`);
    if (result.skippedConflicts.length > 0) {
      printWarning(`${result.skippedConflicts.length} file(s) skipped (already exist with different content):`);
      for (const f of result.skippedConflicts) console.warn(`    - ${f}`);
      console.warn(`  Re-run with --force to overwrite them.`);
    }
  } catch (err) {
    printErrorAndSetExitCode(err);
  }
}
import { findWorkspaceRoot } from "../core/workspace.js";
import { buildExportZip } from "../core/export.js";
import { LadderlineError } from "../core/errors.js";

export function runExport(options: { person?: string; cycle?: string; since?: string }): void {
  try {
    const workspace = findWorkspaceRoot();
    const zip = buildExportZip(workspace, options);

    const parts = ["ladderline-export"];
    if (options.person) parts.push(options.person.toLowerCase().replace(/\s+/g, "-"));
    if (options.cycle) parts.push(options.cycle);
    if (options.since) parts.push(`since-${options.since}`);
    const filename = `${parts.join("-")}.zip`;

    zip.writeZip(filename);
    console.log(`✓ Exported: ${filename}`);
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

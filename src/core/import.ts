import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import AdmZip from "adm-zip";

export interface ImportResult {
  createdFreshWorkspace: boolean;
  imported: string[];
  skippedConflicts: string[];
}

export function importZip(targetDir: string, zipPath: string, options: { force?: boolean }): ImportResult {
  const zip = new AdmZip(zipPath);
  const workspaceAlreadyExists = existsSync(join(targetDir, "ladderline", "config.yaml"));

  if (!workspaceAlreadyExists) {
    zip.extractAllTo(targetDir, true);
    const imported = zip.getEntries().filter((e) => !e.isDirectory).map((e) => e.entryName);
    return { createdFreshWorkspace: true, imported, skippedConflicts: [] };
  }

  const imported: string[] = [];
  const skippedConflicts: string[] = [];

  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue;

    const destPath = join(targetDir, entry.entryName);
    const incomingData = entry.getData();

    if (!existsSync(destPath)) {
      mkdirSync(dirname(destPath), { recursive: true });
      writeFileSync(destPath, incomingData);
      imported.push(entry.entryName);
      continue;
    }

    const existingData = readFileSync(destPath);
    if (existingData.equals(incomingData)) {
      continue;
    }

    if (options.force) {
      writeFileSync(destPath, incomingData);
      imported.push(entry.entryName);
    } else {
      skippedConflicts.push(entry.entryName);
    }
  }

  return { createdFreshWorkspace: false, imported, skippedConflicts };
}

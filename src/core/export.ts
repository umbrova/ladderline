import { existsSync } from "node:fs";
import { join } from "node:path";
import AdmZip from "adm-zip";
import { listTrackedPeople } from "./people.js";
import { listNotes } from "./notes.js";

export interface ExportFilters {
  person?: string;
  cycle?: string;
  since?: string;
}

export function buildExportZip(workspacePath: string, filters: ExportFilters): AdmZip {
  const zip = new AdmZip();
  const root = "ladderline";

  zip.addLocalFile(join(workspacePath, "config.yaml"), root);
  if (existsSync(join(workspacePath, "cycles.yaml"))) {
    zip.addLocalFile(join(workspacePath, "cycles.yaml"), root);
  }

  const allPeople = filters.person
    ? listTrackedPeople(workspacePath).filter((p) => p.record.name === filters.person)
    : listTrackedPeople(workspacePath);

  const includedLadders = new Set<string>();

  for (const person of allPeople) {
    const notes = listNotes(workspacePath, person.record.name).filter((n) => {
      if (filters.cycle && n.frontmatter.cycle !== filters.cycle) return false;
      if (filters.since && n.frontmatter.date < filters.since) return false;
      return true;
    });

    if (notes.length === 0 && !filters.person) continue;

    zip.addLocalFile(join(workspacePath, person.slug, "person.yaml"), `${root}/${person.slug}`);
    for (const note of notes) {
      zip.addLocalFile(join(workspacePath, person.slug, note.filename), `${root}/${person.slug}`);
    }
    includedLadders.add(person.record.ladder);
  }

  for (const ladderFile of includedLadders) {
    zip.addLocalFile(join(workspacePath, "ladders", ladderFile), `${root}/ladders`);
  }

  return zip;
}

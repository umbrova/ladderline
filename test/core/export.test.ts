import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspace } from "../../src/core/workspace.js";
import { trackPerson } from "../../src/core/people.js";
import { addCycle } from "../../src/core/cycles.js";
import { addNote } from "../../src/core/notes.js";
import { buildExportZip } from "../../src/core/export.js";

describe("export", () => {
  let testDir: string;
  let workspace: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "ladderline-test-"));
    workspace = createWorkspace(testDir);
    addCycle(workspace, "2026-Q1", "2026-01-01", "2026-03-31");
    trackPerson(workspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
    trackPerson(workspace, "Raj Patel", { ladder: "generic-ic-ladder.yaml", as: "report" });
    addNote(workspace, "Sarah Chen", { tag: "technical-direction", date: "2026-02-10", text: "note A" });
    addNote(workspace, "Raj Patel", { tag: "mentorship", date: "2026-02-15", text: "note B" });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  function entryNames(zip: ReturnType<typeof buildExportZip>): string[] {
    return zip.getEntries().map((e) => e.entryName).sort();
  }

  it("a full export includes both people, their ladder, config, and cycles", () => {
    const zip = buildExportZip(workspace, {});
    const names = entryNames(zip);
    expect(names).toContain("ladderline/config.yaml");
    expect(names).toContain("ladderline/cycles.yaml");
    expect(names).toContain("ladderline/ladders/generic-ic-ladder.yaml");
    expect(names).toContain("ladderline/sarah-chen/person.yaml");
    expect(names).toContain("ladderline/raj-patel/person.yaml");
  });

  it("a --person export includes only that person", () => {
    const zip = buildExportZip(workspace, { person: "Sarah Chen" });
    const names = entryNames(zip);
    expect(names.some((n) => n.includes("sarah-chen"))).toBe(true);
    expect(names.some((n) => n.includes("raj-patel"))).toBe(false);
  });

  it("a --cycle export includes only notes from that cycle", () => {
    addCycle(workspace, "2026-Q2", "2026-04-01", "2026-06-30");
    addNote(workspace, "Sarah Chen", { tag: "reliability", date: "2026-05-01", text: "Q2 note" });

    const zip = buildExportZip(workspace, { cycle: "2026-Q1" });
    const names = entryNames(zip);
    expect(names.some((n) => n.endsWith("2026-02-10-technical-direction.md"))).toBe(true);
    expect(names.some((n) => n.endsWith("2026-05-01-reliability.md"))).toBe(false);
  });
});

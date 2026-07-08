import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspace } from "../../src/core/workspace.js";
import { trackPerson } from "../../src/core/people.js";
import { addNote } from "../../src/core/notes.js";
import { buildExportZip } from "../../src/core/export.js";
import { importZip } from "../../src/core/import.js";

describe("import", () => {
  let sourceDir: string;
  let sourceWorkspace: string;
  let zipPath: string;

  beforeEach(() => {
    sourceDir = mkdtempSync(join(tmpdir(), "ladderline-source-"));
    sourceWorkspace = createWorkspace(sourceDir);
    trackPerson(sourceWorkspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
    addNote(sourceWorkspace, "Sarah Chen", { tag: "technical-direction", date: "2026-02-10", text: "original note" });

    zipPath = join(sourceDir, "export.zip");
    buildExportZip(sourceWorkspace, {}).writeZip(zipPath);
  });

  afterEach(() => {
    rmSync(sourceDir, { recursive: true, force: true });
  });

  it("creates a brand new workspace when none exists at the target", () => {
    const targetDir = mkdtempSync(join(tmpdir(), "ladderline-target-"));
    const result = importZip(targetDir, zipPath, {});
    expect(result.createdFreshWorkspace).toBe(true);
    expect(existsSync(join(targetDir, "ladderline", "sarah-chen", "person.yaml"))).toBe(true);
    rmSync(targetDir, { recursive: true, force: true });
  });

  it("merges new files into an existing workspace without touching what's already there", () => {
    const targetDir = mkdtempSync(join(tmpdir(), "ladderline-target-"));
    createWorkspace(targetDir);

    const result = importZip(targetDir, zipPath, {});
    expect(result.createdFreshWorkspace).toBe(false);
    expect(existsSync(join(targetDir, "ladderline", "sarah-chen", "person.yaml"))).toBe(true);
    rmSync(targetDir, { recursive: true, force: true });
  });

  it("refuses to overwrite a conflicting file by default", () => {
    const targetDir = mkdtempSync(join(tmpdir(), "ladderline-target-"));
    const targetWorkspace = createWorkspace(targetDir);
    trackPerson(targetWorkspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
    addNote(targetWorkspace, "Sarah Chen", { tag: "technical-direction", date: "2026-02-10", text: "a DIFFERENT local note, same filename" });

    const result = importZip(targetDir, zipPath, {});
    expect(result.skippedConflicts.length).toBeGreaterThan(0);

    const content = readFileSync(join(targetDir, "ladderline", "sarah-chen", "2026-02-10-technical-direction.md"), "utf-8");
    expect(content).toContain("a DIFFERENT local note");
    rmSync(targetDir, { recursive: true, force: true });
  });

  it("overwrites conflicts when --force is passed", () => {
    const targetDir = mkdtempSync(join(tmpdir(), "ladderline-target-"));
    const targetWorkspace = createWorkspace(targetDir);
    trackPerson(targetWorkspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
    addNote(targetWorkspace, "Sarah Chen", { tag: "technical-direction", date: "2026-02-10", text: "a DIFFERENT local note, same filename" });

    importZip(targetDir, zipPath, { force: true });

    const content = readFileSync(join(targetDir, "ladderline", "sarah-chen", "2026-02-10-technical-direction.md"), "utf-8");
    expect(content).toContain("original note");
    rmSync(targetDir, { recursive: true, force: true });
  });
});

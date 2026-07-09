import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspace } from "../../src/core/workspace.js";
import { seedDemoData } from "../../src/core/demo.js";
import { listTrackedPeople } from "../../src/core/people.js";
import { listNotes } from "../../src/core/notes.js";
import { buildPersonOverview } from "../../src/core/overview.js";

describe("seedDemoData", () => {
  let testDir: string;
  let workspace: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "ladderline-test-"));
    workspace = createWorkspace(testDir);
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("creates exactly one demo person", () => {
    seedDemoData(workspace);
    const people = listTrackedPeople(workspace);
    expect(people).toHaveLength(1);
    expect(people[0].record.name).toBe("Sam Example");
  });

  it("creates 3 notes, all clearly marked as demo content", () => {
    seedDemoData(workspace);
    const notes = listNotes(workspace, "Sam Example");
    expect(notes).toHaveLength(3);
    expect(notes.every((n) => n.body.startsWith("[DEMO]"))).toBe(true);
  });

  it("deliberately leaves one competency with zero notes, to demonstrate a gap", () => {
    seedDemoData(workspace);
    const overview = buildPersonOverview(workspace, "Sam Example");
    const reliability = overview.sections.find((s) => s.tagId === "reliability")!;
    expect(reliability.noteCount).toBe(0);
    const withEvidence = overview.sections.filter((s) => s.noteCount > 0);
    expect(withEvidence).toHaveLength(3);
  });

  it("defines a cycle covering the seeded notes' dates", () => {
    seedDemoData(workspace);
    const notes = listNotes(workspace, "Sam Example");
    expect(notes.every((n) => n.frontmatter.cycle === "demo-cycle")).toBe(true);
  });
});
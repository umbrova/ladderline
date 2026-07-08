import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspace } from "../../src/core/workspace.js";
import { trackPerson } from "../../src/core/people.js";
import { addCycle } from "../../src/core/cycles.js";
import { addNote, listAllNotes } from "../../src/core/notes.js";

describe("listAllNotes", () => {
  let testDir: string;
  let workspace: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "ladderline-test-"));
    workspace = createWorkspace(testDir);
    addCycle(workspace, "2026-Q1", "2026-01-01", "2026-03-31");
    trackPerson(workspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
    trackPerson(workspace, "Raj Patel", { ladder: "generic-ic-ladder.yaml", as: "report" });
    addNote(workspace, "Sarah Chen", { tag: "technical-direction", date: "2026-02-10", text: "sarah tagged" });
    addNote(workspace, "Sarah Chen", { notag: true, date: "2026-03-01", text: "sarah notag" });
    addNote(workspace, "Raj Patel", { tag: "mentorship", date: "2026-02-15", text: "raj tagged" });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("returns everyone's notes, newest first, with no filters", () => {
    const notes = listAllNotes(workspace, {});
    expect(notes).toHaveLength(3);
    expect(notes[0].frontmatter.date >= notes[1].frontmatter.date).toBe(true);
  });

  it("filters by person", () => {
    const notes = listAllNotes(workspace, { person: "Sarah Chen" });
    expect(notes).toHaveLength(2);
    expect(notes.every((n) => n.personName === "Sarah Chen")).toBe(true);
  });

  it("filters by tag", () => {
    const notes = listAllNotes(workspace, { tag: "mentorship" });
    expect(notes).toHaveLength(1);
    expect(notes[0].personName).toBe("Raj Patel");
  });

  it("filters by cycle", () => {
    const notes = listAllNotes(workspace, { cycle: "2026-Q1" });
    expect(notes.length).toBeGreaterThan(0);
    expect(notes.every((n) => n.frontmatter.cycle === "2026-Q1")).toBe(true);
  });

  it("filters to notagOnly", () => {
    const notes = listAllNotes(workspace, { notagOnly: true });
    expect(notes).toHaveLength(1);
    expect(notes[0].body).toBe("sarah notag");
  });
});
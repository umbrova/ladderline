import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspace } from "../../src/core/workspace.js";
import { trackPerson } from "../../src/core/people.js";
import { addCycle } from "../../src/core/cycles.js";
import { addNote, listNotes } from "../../src/core/notes.js";
import { PersonNotTrackedError, MissingTagError, InvalidTagError } from "../../src/core/errors.js";

describe("notes", () => {
  let testDir: string;
  let workspace: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "ladderline-test-"));
    workspace = createWorkspace(testDir);
    trackPerson(workspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("refuses to log a note for an untracked person", () => {
    expect(() => addNote(workspace, "Nobody", { tag: "reliability", text: "..." })).toThrow(PersonNotTrackedError);
  });

  it("refuses a note with neither --tag nor --notag", () => {
    expect(() => addNote(workspace, "Sarah Chen", { text: "..." })).toThrow(MissingTagError);
  });

  it("rejects a tag that isn't on the person's ladder", () => {
    expect(() => addNote(workspace, "Sarah Chen", { tag: "not-a-real-tag", text: "..." })).toThrow(InvalidTagError);
  });

  it("writes a note with the correct frontmatter and derives the cycle", () => {
    addCycle(workspace, "2026-Q1", "2026-01-01", "2026-03-31");
    const result = addNote(workspace, "Sarah Chen", { tag: "reliability", date: "2026-02-10", text: "Pushed back on the caching design..." });
    expect(result.warning).toBeUndefined();

    const notes = listNotes(workspace, "Sarah Chen");
    expect(notes).toHaveLength(1);
    expect(notes[0].frontmatter.tag).toBe("reliability");
    expect(notes[0].frontmatter.cycle).toBe("2026-Q1");
    expect(notes[0].body).toContain("Pushed back on the caching design");
  });

  it("saves a note with a warning, not an error, when no cycle covers the date", () => {
    const result = addNote(workspace, "Sarah Chen", { tag: "reliability", date: "2099-01-01", text: "..." });
    expect(result.warning).toContain("No defined cycle covers");
    expect(listNotes(workspace, "Sarah Chen")).toHaveLength(1);
  });

  it("saves a --notag note without a tag field", () => {
    addNote(workspace, "Sarah Chen", { notag: true, date: "2026-02-10", text: "..." });
    const notes = listNotes(workspace, "Sarah Chen");
    expect(notes[0].frontmatter.tag).toBeUndefined();
  });

  it("avoids filename collisions for same-day, same-tag notes", () => {
    addNote(workspace, "Sarah Chen", { tag: "reliability", date: "2026-02-10", text: "first" });
    addNote(workspace, "Sarah Chen", { tag: "reliability", date: "2026-02-10", text: "second" });
    const notes = listNotes(workspace, "Sarah Chen");
    expect(notes).toHaveLength(2);
    expect(notes.map((n) => n.filename).sort()).toEqual(["2026-02-10-reliability-2.md", "2026-02-10-reliability.md"]);
  });
});

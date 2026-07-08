import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspace } from "../../src/core/workspace.js";
import { trackPerson } from "../../src/core/people.js";
import { addNote, deleteNote, findMatchingNotes } from "../../src/core/notes.js";
import { PersonNotTrackedError, NoteNotFoundError, AmbiguousNoteError } from "../../src/core/errors.js";

describe("deleteNote", () => {
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

  it("refuses for an untracked person", () => {
    expect(() => deleteNote(workspace, "Nobody", { tag: "reliability", date: "2026-02-10" })).toThrow(PersonNotTrackedError);
  });

  it("throws NoteNotFoundError when nothing matches", () => {
    expect(() => deleteNote(workspace, "Sarah Chen", { tag: "reliability", date: "2026-02-10" })).toThrow(NoteNotFoundError);
  });

  it("deletes the single matching note", () => {
    addNote(workspace, "Sarah Chen", { tag: "reliability", date: "2026-02-10", text: "..." });
    const path = deleteNote(workspace, "Sarah Chen", { tag: "reliability", date: "2026-02-10" });
    expect(existsSync(path)).toBe(false);
  });

  it("refuses when more than one note matches the same date + tag", () => {
    addNote(workspace, "Sarah Chen", { tag: "reliability", date: "2026-02-10", text: "first" });
    addNote(workspace, "Sarah Chen", { tag: "reliability", date: "2026-02-10", text: "second" });
    expect(findMatchingNotes(workspace, "Sarah Chen", { tag: "reliability", date: "2026-02-10" })).toHaveLength(2);
    expect(() => deleteNote(workspace, "Sarah Chen", { tag: "reliability", date: "2026-02-10" })).toThrow(AmbiguousNoteError);
  });

  it("resolves ambiguity with an explicit --filename", () => {
    addNote(workspace, "Sarah Chen", { tag: "reliability", date: "2026-02-10", text: "first" });
    addNote(workspace, "Sarah Chen", { tag: "reliability", date: "2026-02-10", text: "second" });
    const path = deleteNote(workspace, "Sarah Chen", { tag: "reliability", date: "2026-02-10", filename: "2026-02-10-reliability-2.md" });
    expect(path.endsWith("2026-02-10-reliability-2.md")).toBe(true);
    expect(existsSync(path)).toBe(false);
    expect(findMatchingNotes(workspace, "Sarah Chen", { tag: "reliability", date: "2026-02-10" })).toHaveLength(1);
  });
});
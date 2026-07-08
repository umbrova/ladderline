import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspace } from "../../src/core/workspace.js";
import { trackPerson } from "../../src/core/people.js";
import { addNote } from "../../src/core/notes.js";
import { buildPersonOverview } from "../../src/core/overview.js";
import { PersonNotTrackedError } from "../../src/core/errors.js";

describe("buildPersonOverview", () => {
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
    expect(() => buildPersonOverview(workspace, "Nobody")).toThrow(PersonNotTrackedError);
  });

  it("is cycle-agnostic — includes notes with no cycle at all", () => {
    addNote(workspace, "Sarah Chen", { tag: "reliability", date: "2026-02-10", text: "some evidence" });
    const overview = buildPersonOverview(workspace, "Sarah Chen");
    const section = overview.sections.find((s) => s.tagId === "reliability")!;
    expect(section.noteCount).toBe(1);
  });

  it("shows the most recent note's date and snippet, not the oldest", () => {
    addNote(workspace, "Sarah Chen", { tag: "reliability", date: "2026-01-05", text: "older note" });
    addNote(workspace, "Sarah Chen", { tag: "reliability", date: "2026-03-20", text: "newer note" });
    const overview = buildPersonOverview(workspace, "Sarah Chen");
    const section = overview.sections.find((s) => s.tagId === "reliability")!;
    expect(section.noteCount).toBe(2);
    expect(section.lastDate).toBe("2026-03-20");
    expect(section.latestSnippet).toBe("newer note");
  });

  it("leaves lastDate/latestSnippet undefined for a tag with zero notes", () => {
    const overview = buildPersonOverview(workspace, "Sarah Chen");
    const section = overview.sections.find((s) => s.tagId === "mentorship")!;
    expect(section.noteCount).toBe(0);
    expect(section.lastDate).toBeUndefined();
    expect(section.latestSnippet).toBeUndefined();
  });

  it("totalNotes excludes notag entries", () => {
    addNote(workspace, "Sarah Chen", { tag: "reliability", date: "2026-02-10", text: "tagged" });
    addNote(workspace, "Sarah Chen", { notag: true, date: "2026-02-15", text: "unfiled" });
    const overview = buildPersonOverview(workspace, "Sarah Chen");
    expect(overview.totalNotes).toBe(1);
  });
});
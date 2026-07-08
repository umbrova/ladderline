import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspace } from "../../src/core/workspace.js";
import { trackPerson } from "../../src/core/people.js";
import { addNote, listNotagNotes } from "../../src/core/notes.js";

describe("listNotagNotes", () => {
  let testDir: string;
  let workspace: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "ladderline-test-"));
    workspace = createWorkspace(testDir);
    trackPerson(workspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
    trackPerson(workspace, "Raj Patel", { ladder: "generic-ic-ladder.yaml", as: "report" });
    addNote(workspace, "Sarah Chen", { tag: "technical-direction", date: "2026-02-10", text: "tagged note" });
    addNote(workspace, "Sarah Chen", { notag: true, date: "2026-02-15", text: "sarah's notag" });
    addNote(workspace, "Raj Patel", { notag: true, date: "2026-03-01", text: "raj's notag" });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("returns notag entries across everyone by default", () => {
    const notes = listNotagNotes(workspace);
    expect(notes).toHaveLength(2);
    expect(notes.map((n) => n.personName).sort()).toEqual(["Raj Patel", "Sarah Chen"]);
  });

  it("filters to one person when given a name", () => {
    const notes = listNotagNotes(workspace, "Sarah Chen");
    expect(notes).toHaveLength(1);
    expect(notes[0].body).toBe("sarah's notag");
  });

  it("never includes tagged notes", () => {
    const notes = listNotagNotes(workspace);
    expect(notes.every((n) => !n.frontmatter.tag)).toBe(true);
  });
});
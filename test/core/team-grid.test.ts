import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspace } from "../../src/core/workspace.js";
import { trackPerson } from "../../src/core/people.js";
import { addNote } from "../../src/core/notes.js";
import { buildTeamGrid } from "../../src/core/team-grid.js";

describe("buildTeamGrid", () => {
  let testDir: string;
  let workspace: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "ladderline-test-"));
    workspace = createWorkspace(testDir);
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("returns empty tags/rows when nobody is tracked", () => {
    const grid = buildTeamGrid(workspace);
    expect(grid.tags).toHaveLength(0);
    expect(grid.rows).toHaveLength(0);
  });

  it("builds one row per tracked person, with the right per-tag counts", () => {
    trackPerson(workspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
    trackPerson(workspace, "Raj Patel", { ladder: "generic-ic-ladder.yaml", as: "report" });
    addNote(workspace, "Sarah Chen", { tag: "technical-direction", date: "2026-02-10", text: "..." });
    addNote(workspace, "Raj Patel", { tag: "mentorship", date: "2026-02-15", text: "..." });

    const grid = buildTeamGrid(workspace);
    expect(grid.rows).toHaveLength(2);
    expect(grid.tags.map((t) => t.id).sort()).toEqual(["mentorship", "reliability", "technical-direction", "technical-execution"].sort());

    const sarahRow = grid.rows.find((r) => r.name === "Sarah Chen")!;
    expect(sarahRow.cells["technical-direction"]).toEqual({ noteCount: 1, lastDate: "2026-02-10" });
    expect(sarahRow.cells["mentorship"]).toEqual({ noteCount: 0, lastDate: undefined });
  });

  it("shows null (not applicable) for a tag that doesn't exist on a person's own ladder", () => {
    writeFileSync(join(workspace, "ladders", "other-ladder.yaml"), `ladder: "Other"\ncompetencies:\n  - id: unique-to-other\n    name: "Unique To Other"\n    current_level: "a"\n    next_level: "b"\n`);

    trackPerson(workspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
    trackPerson(workspace, "Devesh Kumar", { ladder: "other-ladder.yaml", as: "cross-team" });

    const grid = buildTeamGrid(workspace);
    const sarahRow = grid.rows.find((r) => r.name === "Sarah Chen")!;
    const deveshRow = grid.rows.find((r) => r.name === "Devesh Kumar")!;

    expect(sarahRow.cells["unique-to-other"]).toBeNull();
    expect(deveshRow.cells["technical-direction"]).toBeNull();
    expect(deveshRow.cells["unique-to-other"]).toEqual({ noteCount: 0, lastDate: undefined });
  });
});
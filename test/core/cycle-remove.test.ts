import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspace } from "../../src/core/workspace.js";
import { trackPerson } from "../../src/core/people.js";
import { addCycle, listCycles, removeCycle } from "../../src/core/cycles.js";
import { addNote } from "../../src/core/notes.js";
import { CycleNotFoundError } from "../../src/core/errors.js";

describe("removeCycle", () => {
  let testDir: string;
  let workspace: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "ladderline-test-"));
    workspace = createWorkspace(testDir);
    addCycle(workspace, "2026-Q1", "2026-01-01", "2026-03-31");
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("throws for a cycle that doesn't exist", () => {
    expect(() => removeCycle(workspace, "2026-Q9")).toThrow(CycleNotFoundError);
  });

  it("removes a cycle nothing references, with no warning", () => {
    const result = removeCycle(workspace, "2026-Q1");
    expect(result.warning).toBeUndefined();
    expect(listCycles(workspace)).toHaveLength(0);
  });

  it("removes the cycle but warns when notes still reference it", () => {
    trackPerson(workspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
    addNote(workspace, "Sarah Chen", { tag: "reliability", date: "2026-02-10", text: "..." });
    const result = removeCycle(workspace, "2026-Q1");
    expect(result.warning).toContain("still reference cycle");
    expect(listCycles(workspace)).toHaveLength(0);
  });
});
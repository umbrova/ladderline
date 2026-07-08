import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspace } from "../../src/core/workspace.js";
import { trackPerson, listTrackedPeople } from "../../src/core/people.js";

describe("listTrackedPeople", () => {
  let testDir: string;
  let workspace: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "ladderline-test-"));
    workspace = createWorkspace(testDir);
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("returns an empty list when nobody is tracked yet", () => {
    expect(listTrackedPeople(workspace)).toEqual([]);
  });

  it("lists every tracked person, excluding the ladders folder", () => {
    trackPerson(workspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
    trackPerson(workspace, "Devesh Kumar", { ladder: "generic-ic-ladder.yaml", as: "cross-team" });

    const people = listTrackedPeople(workspace);
    expect(people).toHaveLength(2);
    expect(people.map((p) => p.record.name).sort()).toEqual(["Devesh Kumar", "Sarah Chen"]);
    expect(people.every((p) => p.slug !== "ladders")).toBe(true);
  });

  it("can be filtered by relationship, same as --as does", () => {
    trackPerson(workspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
    trackPerson(workspace, "Devesh Kumar", { ladder: "generic-ic-ladder.yaml", as: "cross-team" });

    const reports = listTrackedPeople(workspace).filter((p) => p.record.as === "report");
    expect(reports).toHaveLength(1);
    expect(reports[0].record.name).toBe("Sarah Chen");
  });
});

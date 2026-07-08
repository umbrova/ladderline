import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspace } from "../../src/core/workspace.js";
import { trackPerson, isTracked, loadPerson, slugify } from "../../src/core/people.js";
import { PersonAlreadyTrackedError, InvalidRelationshipError, LadderNotFoundError } from "../../src/core/errors.js";

describe("people", () => {
  let testDir: string;
  let workspace: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "ladderline-test-"));
    workspace = createWorkspace(testDir);
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("slugifies a display name into a kebab-case folder name", () => {
    expect(slugify("Sarah Chen")).toBe("sarah-chen");
  });

  it("tracks a person with a valid ladder and relationship", () => {
    trackPerson(workspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
    expect(isTracked(workspace, "Sarah Chen")).toBe(true);
    const record = loadPerson(workspace, "Sarah Chen");
    expect(record.ladder).toBe("generic-ic-ladder.yaml");
    expect(record.as).toBe("report");
  });

  it("refuses to track the same person twice", () => {
    trackPerson(workspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
    expect(() => trackPerson(workspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" })).toThrow(PersonAlreadyTrackedError);
  });

  it("rejects an invalid --as value", () => {
    expect(() => trackPerson(workspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "manager" })).toThrow(InvalidRelationshipError);
  });

  it("rejects a ladder that isn't registered in this workspace", () => {
    expect(() => trackPerson(workspace, "Sarah Chen", { ladder: "nonexistent.yaml", as: "report" })).toThrow(LadderNotFoundError);
  });
});

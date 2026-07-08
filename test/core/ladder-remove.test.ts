import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspace } from "../../src/core/workspace.js";
import { trackPerson } from "../../src/core/people.js";
import { removeLadder } from "../../src/core/ladder.js";
import { LadderNotFoundError, LadderInUseError } from "../../src/core/errors.js";

describe("removeLadder", () => {
  let testDir: string;
  let workspace: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "ladderline-test-"));
    workspace = createWorkspace(testDir);
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("throws for a ladder that isn't registered", () => {
    expect(() => removeLadder(workspace, "nonexistent.yaml", {})).toThrow(LadderNotFoundError);
  });

  it("removes a ladder nobody is assigned to", () => {
    removeLadder(workspace, "generic-ic-ladder.yaml", {});
    expect(existsSync(join(workspace, "ladders", "generic-ic-ladder.yaml"))).toBe(false);
  });

  it("refuses to remove a ladder someone is still assigned to", () => {
    trackPerson(workspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
    expect(() => removeLadder(workspace, "generic-ic-ladder.yaml", {})).toThrow(LadderInUseError);
    expect(existsSync(join(workspace, "ladders", "generic-ic-ladder.yaml"))).toBe(true);
  });

  it("removes it anyway when --force is passed", () => {
    trackPerson(workspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
    removeLadder(workspace, "generic-ic-ladder.yaml", { force: true });
    expect(existsSync(join(workspace, "ladders", "generic-ic-ladder.yaml"))).toBe(false);
  });
});
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspace } from "../../src/core/workspace.js";
import { listLadders, addLadder, loadLadder, getValidTags } from "../../src/core/ladder.js";
import { InvalidLadderFileError, LadderAlreadyExistsError, LadderNotFoundError } from "../../src/core/errors.js";

describe("ladder", () => {
  let testDir: string;
  let workspace: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "ladderline-test-"));
    workspace = createWorkspace(testDir);
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("lists the bundled default ladder after init", () => {
    expect(listLadders(workspace)).toEqual(["generic-ic-ladder.yaml"]);
  });

  it("registers a valid external ladder", () => {
    const externalPath = join(testDir, "custom-ladder.yaml");
    writeFileSync(externalPath, `ladder: "Custom"\ncompetencies:\n  - id: foo\n    name: "Foo"\n`);
    addLadder(workspace, externalPath);
    expect(listLadders(workspace)).toContain("custom-ladder.yaml");
  });

  it("refuses a ladder with no competencies", () => {
    const externalPath = join(testDir, "bad.yaml");
    writeFileSync(externalPath, `ladder: "Bad"\n`);
    expect(() => addLadder(workspace, externalPath)).toThrow(InvalidLadderFileError);
  });

  it("refuses genuinely malformed YAML, not just wrong shape", () => {
    const externalPath = join(testDir, "broken.yaml");
    writeFileSync(externalPath, `not: valid: yaml: [structure\n`);
    expect(() => addLadder(workspace, externalPath)).toThrow(InvalidLadderFileError);
  });

  it("refuses to re-register a ladder with the same filename", () => {
    const externalPath = join(testDir, "generic-ic-ladder.yaml");
    writeFileSync(externalPath, `ladder: "Different content, same filename"\ncompetencies:\n  - id: foo\n    name: "Foo"\n`);
    expect(() => addLadder(workspace, externalPath)).toThrow(LadderAlreadyExistsError);
  });

  it("loads a ladder and extracts its valid tag ids", () => {
    const ladder = loadLadder(workspace, "generic-ic-ladder.yaml");
    expect(getValidTags(ladder)).toContain("technical-direction");
  });

  it("throws LadderNotFoundError for an unregistered ladder", () => {
    expect(() => loadLadder(workspace, "nonexistent.yaml")).toThrow(LadderNotFoundError);
  });
});

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createWorkspace,
  findWorkspaceRoot,
  workspaceExists,
} from "../../src/core/workspace.js";
import { WorkspaceAlreadyExistsError, WorkspaceNotFoundError } from "../../src/core/errors.js";

describe("workspace", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "ladderline-test-"));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("creates config.yaml, cycles.yaml, and a default ladder", () => {
    createWorkspace(testDir);
    expect(existsSync(join(testDir, "ladderline", "config.yaml"))).toBe(true);
    expect(existsSync(join(testDir, "ladderline", "cycles.yaml"))).toBe(true);
    expect(existsSync(join(testDir, "ladderline", "ladders", "generic-ic-ladder.yaml"))).toBe(true);
  });

  it("refuses to create a workspace that already exists", () => {
    createWorkspace(testDir);
    expect(() => createWorkspace(testDir)).toThrow(WorkspaceAlreadyExistsError);
  });

  it("finds the workspace root from a nested subdirectory", () => {
    createWorkspace(testDir);
    const nested = join(testDir, "some", "nested", "folder");
    mkdirSync(nested, { recursive: true });
    expect(findWorkspaceRoot(nested)).toBe(join(testDir, "ladderline"));
  });

  it("throws WorkspaceNotFoundError when no workspace exists", () => {
    expect(() => findWorkspaceRoot(testDir)).toThrow(WorkspaceNotFoundError);
  });

  it("workspaceExists returns false rather than throwing when none exists", () => {
    expect(workspaceExists(testDir)).toBe(false);
    createWorkspace(testDir);
    expect(workspaceExists(testDir)).toBe(true);
  });
});

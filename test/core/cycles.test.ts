import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspace } from "../../src/core/workspace.js";
import { addCycle, listCycles, findCycleForDate } from "../../src/core/cycles.js";
import { CycleAlreadyExistsError, InvalidDateRangeError } from "../../src/core/errors.js";

describe("cycles", () => {
  let testDir: string;
  let workspace: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "ladderline-test-"));
    workspace = createWorkspace(testDir);
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("defines a cycle and lists it", () => {
    addCycle(workspace, "2026-Q1", "2026-01-01", "2026-03-31");
    expect(listCycles(workspace)).toEqual([{ name: "2026-Q1", start: "2026-01-01", end: "2026-03-31" }]);
  });

  it("refuses a duplicate cycle name", () => {
    addCycle(workspace, "2026-Q1", "2026-01-01", "2026-03-31");
    expect(() => addCycle(workspace, "2026-Q1", "2026-04-01", "2026-06-30")).toThrow(CycleAlreadyExistsError);
  });

  it("refuses a cycle where start is after end", () => {
    expect(() => addCycle(workspace, "bad", "2026-06-30", "2026-01-01")).toThrow(InvalidDateRangeError);
  });

  it("finds the right cycle for a date inside it", () => {
    addCycle(workspace, "2026-Q1", "2026-01-01", "2026-03-31");
    expect(findCycleForDate(workspace, "2026-02-10")).toBe("2026-Q1");
  });

  it("returns undefined for a date outside any defined cycle", () => {
    addCycle(workspace, "2026-Q1", "2026-01-01", "2026-03-31");
    expect(findCycleForDate(workspace, "2025-12-25")).toBeUndefined();
  });
});

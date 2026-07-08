import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspace } from "../../src/core/workspace.js";
import { trackPerson, archivePerson, purgePerson, listTrackedPeople } from "../../src/core/people.js";
import { addNote } from "../../src/core/notes.js";
import { PersonNotTrackedError } from "../../src/core/errors.js";

describe("archivePerson / purgePerson", () => {
  let testDir: string;
  let workspace: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "ladderline-test-"));
    workspace = createWorkspace(testDir);
    trackPerson(workspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
    addNote(workspace, "Sarah Chen", { tag: "reliability", date: "2026-02-10", text: "..." });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("refuses to archive someone who isn't tracked", () => {
    expect(() => archivePerson(workspace, "Nobody")).toThrow(PersonNotTrackedError);
  });

  it("moves the person's folder under archived/, preserving their notes", () => {
    archivePerson(workspace, "Sarah Chen");
    expect(existsSync(join(workspace, "sarah-chen"))).toBe(false);
    expect(existsSync(join(workspace, "archived", "sarah-chen", "person.yaml"))).toBe(true);
    expect(existsSync(join(workspace, "archived", "sarah-chen", "2026-02-10-reliability.md"))).toBe(true);
  });

  it("excludes archived people from listTrackedPeople", () => {
    archivePerson(workspace, "Sarah Chen");
    expect(listTrackedPeople(workspace)).toHaveLength(0);
  });

  it("purge permanently removes an active (not-yet-archived) person", () => {
    purgePerson(workspace, "Sarah Chen");
    expect(existsSync(join(workspace, "sarah-chen"))).toBe(false);
  });

  it("purge also works on an already-archived person", () => {
    archivePerson(workspace, "Sarah Chen");
    purgePerson(workspace, "Sarah Chen");
    expect(existsSync(join(workspace, "archived", "sarah-chen"))).toBe(false);
  });

  it("purge throws if the person is neither tracked nor archived", () => {
    expect(() => purgePerson(workspace, "Nobody")).toThrow(PersonNotTrackedError);
  });
});
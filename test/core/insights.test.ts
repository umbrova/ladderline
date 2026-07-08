import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspace } from "../../src/core/workspace.js";
import { trackPerson } from "../../src/core/people.js";
import { addCycle } from "../../src/core/cycles.js";
import { addNote } from "../../src/core/notes.js";
import { buildInsights, buildStalenessNudgeText } from "../../src/core/insights.js";

const FIXED_NOW = new Date("2026-03-01T00:00:00Z");

describe("buildInsights", () => {
  let testDir: string;
  let workspace: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "ladderline-test-"));
    workspace = createWorkspace(testDir);
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("computes coverage as evidence-having sections / total sections", () => {
    trackPerson(workspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
    addNote(workspace, "Sarah Chen", { tag: "reliability", date: "2026-02-15", text: "..." });

    const insights = buildInsights(workspace, FIXED_NOW);
    expect(insights.coverage.total).toBe(4);
    expect(insights.coverage.withEvidence).toBe(1);
    expect(insights.coverage.percent).toBe(25);
  });

  it("flags a tag with no notes at all as going stale, with daysSinceLastNote null", () => {
    trackPerson(workspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
    const insights = buildInsights(workspace, FIXED_NOW);
    const entry = insights.goingStale.find((s) => s.tagName === "Mentorship")!;
    expect(entry.daysSinceLastNote).toBeNull();
  });

  it("flags a tag as stale once its most recent note passes the threshold, using a fixed clock", () => {
    trackPerson(workspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
    addNote(workspace, "Sarah Chen", { tag: "reliability", date: "2026-01-01", text: "old" });
    addNote(workspace, "Sarah Chen", { tag: "mentorship", date: "2026-02-25", text: "recent" });

    const insights = buildInsights(workspace, FIXED_NOW);
    const staleTags = insights.goingStale.map((s) => s.tagName);
    expect(staleTags).toContain("Reliability & Ownership");
    expect(staleTags).not.toContain("Mentorship");
  });

  it("buckets notes into weekly cadence counts", () => {
    trackPerson(workspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
    addNote(workspace, "Sarah Chen", { tag: "reliability", date: "2026-02-02", text: "a" });
    addNote(workspace, "Sarah Chen", { tag: "mentorship", date: "2026-02-04", text: "b" });

    const insights = buildInsights(workspace, FIXED_NOW);
    const bucket = insights.cadence.find((c) => c.weekStart === "2026-02-02");
    expect(bucket?.count).toBe(2);
  });

  it("computes cycle readiness — only counts a person ready if every competency is covered within that cycle", () => {
    addCycle(workspace, "2026-Q1", "2026-01-01", "2026-03-31");
    trackPerson(workspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
    trackPerson(workspace, "Raj Patel", { ladder: "generic-ic-ladder.yaml", as: "report" });

    addNote(workspace, "Sarah Chen", { tag: "technical-execution", date: "2026-01-05", text: "a" });
    addNote(workspace, "Sarah Chen", { tag: "technical-direction", date: "2026-01-10", text: "b" });
    addNote(workspace, "Sarah Chen", { tag: "mentorship", date: "2026-01-15", text: "c" });
    addNote(workspace, "Sarah Chen", { tag: "reliability", date: "2026-01-20", text: "d" });
    addNote(workspace, "Raj Patel", { tag: "mentorship", date: "2026-02-01", text: "e" });

    const insights = buildInsights(workspace, FIXED_NOW);
    const readiness = insights.cycleReadiness.find((c) => c.cycleName === "2026-Q1")!;
    expect(readiness.readyCount).toBe(1);
    expect(readiness.totalPeople).toBe(2);
  });
});
describe("buildStalenessNudgeText", () => {
  let testDir: string;
  let workspace: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "ladderline-test-"));
    workspace = createWorkspace(testDir);
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("returns null when nothing is stale", () => {
    trackPerson(workspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
    addNote(workspace, "Sarah Chen", { tag: "technical-execution", date: "2026-02-28", text: "a" });
    addNote(workspace, "Sarah Chen", { tag: "technical-direction", date: "2026-02-28", text: "b" });
    addNote(workspace, "Sarah Chen", { tag: "mentorship", date: "2026-02-28", text: "c" });
    addNote(workspace, "Sarah Chen", { tag: "reliability", date: "2026-02-28", text: "d" });

    expect(buildStalenessNudgeText(workspace, FIXED_NOW)).toBeNull();
  });

  it("names the person when something is stale", () => {
    trackPerson(workspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
    const text = buildStalenessNudgeText(workspace, FIXED_NOW);
    expect(text).toContain("Sarah Chen");
    expect(text).toContain("1 person");
  });

  it("uses plural wording for more than one person", () => {
    trackPerson(workspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
    trackPerson(workspace, "Raj Patel", { ladder: "generic-ic-ladder.yaml", as: "report" });
    const text = buildStalenessNudgeText(workspace, FIXED_NOW);
    expect(text).toContain("2 people");
    expect(text).toContain("Sarah Chen");
    expect(text).toContain("Raj Patel");
  });
});
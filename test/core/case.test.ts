import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspace } from "../../src/core/workspace.js";
import { trackPerson } from "../../src/core/people.js";
import { addCycle } from "../../src/core/cycles.js";
import { addNote } from "../../src/core/notes.js";
import { buildCaseData, formatCaseAsMarkdown, buildPromptText  } from "../../src/core/case.js";
import { renderCaseAsDocx } from "../../src/core/case-docx.js";
import { PersonNotTrackedError, CycleNotFoundError, EmptyCaseError } from "../../src/core/errors.js";

describe("case", () => {
  let testDir: string;
  let workspace: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "ladderline-test-"));
    workspace = createWorkspace(testDir);
    trackPerson(workspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
    addCycle(workspace, "2026-Q1", "2026-01-01", "2026-03-31");
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("refuses a case for an untracked person", () => {
    expect(() => buildCaseData(workspace, "Nobody", "2026-Q1")).toThrow(PersonNotTrackedError);
  });

  it("refuses a case for a cycle that doesn't exist", () => {
    expect(() => buildCaseData(workspace, "Sarah Chen", "2026-Q9")).toThrow(CycleNotFoundError);
  });

  it("refuses a case with zero notes in that cycle", () => {
    expect(() => buildCaseData(workspace, "Sarah Chen", "2026-Q1")).toThrow(EmptyCaseError);
  });

  it("builds a case with populated and empty sections, honestly", () => {
    addNote(workspace, "Sarah Chen", { tag: "technical-direction", date: "2026-02-10", text: "Pushed back on the caching design" });
    const data = buildCaseData(workspace, "Sarah Chen", "2026-Q1");
    expect(data.totalNotes).toBe(1);
    const directionSection = data.sections.find((s) => s.tagId === "technical-direction")!;
    expect(directionSection.notes).toHaveLength(1);
    const mentorshipSection = data.sections.find((s) => s.tagId === "mentorship")!;
    expect(mentorshipSection.notes).toHaveLength(0);
  });

  it("excludes notag notes from a case", () => {
    addNote(workspace, "Sarah Chen", { notag: true, date: "2026-02-10", text: "an unfiled thought" });
    expect(() => buildCaseData(workspace, "Sarah Chen", "2026-Q1")).toThrow(EmptyCaseError);
  });

  it("renders markdown with an explicit gap marker for empty sections", () => {
    addNote(workspace, "Sarah Chen", { tag: "technical-direction", date: "2026-02-10", text: "Pushed back on the caching design" });
    const data = buildCaseData(workspace, "Sarah Chen", "2026-Q1");
    const md = formatCaseAsMarkdown(data);
    expect(md).toContain("Pushed back on the caching design");
    expect(md).toContain("⚠ No evidence logged this cycle.");
  });

  it("renders a genuine docx file (a valid zip archive)", async () => {
    addNote(workspace, "Sarah Chen", { tag: "reliability", date: "2026-02-10", text: "Owns the notifications service" });
    const data = buildCaseData(workspace, "Sarah Chen", "2026-Q1");
    const buffer = await renderCaseAsDocx(data);
    expect(buffer.subarray(0, 2).toString()).toBe("PK");
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it("embeds the guardrails and the evidence in the generated prompt text", () => {
    addNote(workspace, "Sarah Chen", {
      tag: "reliability",
      date: "2026-02-10",
      text: "Owns the notifications service",
    });
    const data = buildCaseData(workspace, "Sarah Chen", "2026-Q1");
    const prompt = buildPromptText(data);
    expect(prompt).toContain("Do not invent, embellish");
    expect(prompt).toContain("Owns the notifications service");
    expect(prompt).toContain("⚠ No evidence logged this cycle.");
  });
});

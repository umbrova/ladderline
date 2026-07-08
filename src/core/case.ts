import { loadPerson, isTracked } from "./people.js";
import { loadLadder } from "./ladder.js";
import { listCycles } from "./cycles.js";
import { listNotes } from "./notes.js";
import { PersonNotTrackedError, CycleNotFoundError, EmptyCaseError } from "./errors.js";

export interface CaseSection {
  tagId: string;
  tagName: string;
  currentLevel: string;
  nextLevel: string;
  notes: Array<{ date: string; body: string }>;
}

export interface CaseData {
  personName: string;
  ladderName: string;
  cycleName: string;
  cycleStart: string;
  cycleEnd: string;
  sections: CaseSection[];
  totalNotes: number;
}

export function buildCaseData(
  workspacePath: string,
  personName: string,
  cycleName: string
): CaseData {
  if (!isTracked(workspacePath, personName)) {
    throw new PersonNotTrackedError(personName);
  }

  const cycles = listCycles(workspacePath);
  const cycle = cycles.find((c) => c.name === cycleName);
  if (!cycle) {
    throw new CycleNotFoundError(cycleName, cycles.map((c) => c.name));
  }

  const person = loadPerson(workspacePath, personName);
  const ladder = loadLadder(workspacePath, person.ladder);
  const allNotes = listNotes(workspacePath, personName).filter(
    (n) => n.frontmatter.cycle === cycleName && n.frontmatter.tag
  );

  if (allNotes.length === 0) {
    throw new EmptyCaseError(personName, cycleName);
  }

  const sections: CaseSection[] = ladder.competencies.map((c) => ({
    tagId: c.id,
    tagName: c.name,
    currentLevel: c.current_level,
    nextLevel: c.next_level,
    notes: allNotes
      .filter((n) => n.frontmatter.tag === c.id)
      .map((n) => ({ date: n.frontmatter.date, body: n.body }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  }));

  return {
    personName,
    ladderName: ladder.ladder,
    cycleName,
    cycleStart: cycle.start,
    cycleEnd: cycle.end,
    sections,
    totalNotes: allNotes.length,
  };
}

export function formatCaseAsMarkdown(data: CaseData): string {
  const lines: string[] = [];
  lines.push(`# ${data.personName} — ${data.ladderName}`);
  lines.push(`Cycle: ${data.cycleName} (${data.cycleStart} to ${data.cycleEnd})`);
  lines.push("");

  for (const section of data.sections) {
    lines.push(`## ${section.tagName} (${section.notes.length} note${section.notes.length === 1 ? "" : "s"})`);
    if (section.notes.length === 0) {
      lines.push(`⚠ No evidence logged this cycle.`);
    } else {
      for (const note of section.notes) {
        lines.push(`- **${note.date}** — ${note.body}`);
      }
    }
    lines.push("");
  }

  lines.push(`---`);
  lines.push(`Generated from ${data.totalNotes} note${data.totalNotes === 1 ? "" : "s"} logged ${data.cycleStart} to ${data.cycleEnd}.`);

  return lines.join("\n");
}

export function buildPromptText(data: CaseData): string {
  return `You're helping a manager turn structured evidence notes into polished
    prose for a promotion case. Below is a set of dated evidence entries
    for ${data.personName}, grouped by competency, covering cycle ${data.cycleName}.

    Rewrite this into clear, professional narrative suitable for a
    calibration document. Rules:
    - Do not invent, embellish, or add any fact not present below.
    - Every claim must stay traceable to something actually written here —
      keep dates where they add credibility.
    - If a competency has no evidence, say so plainly rather than
      fabricating a strength for it.
    - Keep the tone specific and concrete, not generic praise.

    --- Evidence follows ---

    ${formatCaseAsMarkdown(data)}
  `;
}
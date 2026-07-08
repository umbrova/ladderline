import { loadPerson, isTracked } from "./people.js";
import { loadLadder } from "./ladder.js";
import { listNotes } from "./notes.js";
import { PersonNotTrackedError } from "./errors.js";

export interface OverviewSection {
  tagId: string;
  tagName: string;
  currentLevel: string;
  nextLevel: string;
  noteCount: number;
  lastDate?: string;
  latestSnippet?: string;
}

export interface PersonOverview {
  personName: string;
  ladderName: string;
  sections: OverviewSection[];
  totalNotes: number;
}

const SNIPPET_LENGTH = 80;

export function buildPersonOverview(workspacePath: string, personName: string): PersonOverview {
  if (!isTracked(workspacePath, personName)) {
    throw new PersonNotTrackedError(personName);
  }

  const person = loadPerson(workspacePath, personName);
  const ladder = loadLadder(workspacePath, person.ladder);
  const allNotes = listNotes(workspacePath, personName);

  const sections: OverviewSection[] = ladder.competencies.map((c) => {
    const matching = allNotes
      .filter((n) => n.frontmatter.tag === c.id)
      .sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date));

    const latest = matching[0];
    return {
      tagId: c.id,
      tagName: c.name,
      currentLevel: c.current_level,
      nextLevel: c.next_level,
      noteCount: matching.length,
      lastDate: latest?.frontmatter.date,
      latestSnippet: latest
        ? latest.body.length > SNIPPET_LENGTH
          ? latest.body.slice(0, SNIPPET_LENGTH) + "…"
          : latest.body
        : undefined,
    };
  });

  return {
    personName,
    ladderName: ladder.ladder,
    sections,
    totalNotes: allNotes.filter((n) => n.frontmatter.tag).length,
  };
}
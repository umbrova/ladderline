import { listTrackedPeople } from "./people.js";
import { buildPersonOverview } from "./overview.js";
import { listCycles } from "./cycles.js";
import { listAllNotes } from "./notes.js";

const STALE_THRESHOLD_DAYS = 30;

export interface CoverageInsight {
  percent: number;
  withEvidence: number;
  total: number;
}

export interface StaleEntry {
  personName: string;
  tagName: string;
  lastDate?: string;
  daysSinceLastNote: number | null;
}

export interface CadenceBucket {
  weekStart: string;
  count: number;
}

export interface CycleReadiness {
  cycleName: string;
  readyCount: number;
  totalPeople: number;
}

export interface Insights {
  coverage: CoverageInsight;
  goingStale: StaleEntry[];
  cadence: CadenceBucket[];
  cycleReadiness: CycleReadiness[];
}

function daysBetween(dateStr: string, asOf: Date): number {
  const then = new Date(dateStr + "T00:00:00Z").getTime();
  const now = asOf.getTime();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

function weekStartOf(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  return d.toISOString().slice(0, 10);
}

export function buildInsights(workspacePath: string, asOf: Date = new Date()): Insights {
  const people = listTrackedPeople(workspacePath);
  const overviews = people.map((p) => buildPersonOverview(workspacePath, p.record.name));

  let total = 0;
  let withEvidence = 0;
  for (const overview of overviews) {
    for (const section of overview.sections) {
      total++;
      if (section.noteCount > 0) withEvidence++;
    }
  }
  const coverage: CoverageInsight = {
    percent: total === 0 ? 0 : Math.round((withEvidence / total) * 100),
    withEvidence,
    total,
  };

  const goingStale: StaleEntry[] = [];
  for (const overview of overviews) {
    for (const section of overview.sections) {
      if (!section.lastDate) {
        goingStale.push({ personName: overview.personName, tagName: section.tagName, daysSinceLastNote: null });
        continue;
      }
      const days = daysBetween(section.lastDate, asOf);
      if (days >= STALE_THRESHOLD_DAYS) {
        goingStale.push({ personName: overview.personName, tagName: section.tagName, lastDate: section.lastDate, daysSinceLastNote: days });
      }
    }
  }
  goingStale.sort((a, b) => (b.daysSinceLastNote ?? Infinity) - (a.daysSinceLastNote ?? Infinity));

  const allNotes = listAllNotes(workspacePath, {});
  const buckets = new Map<string, number>();
  for (const note of allNotes) {
    const week = weekStartOf(note.frontmatter.date);
    buckets.set(week, (buckets.get(week) ?? 0) + 1);
  }
  const cadence: CadenceBucket[] = Array.from(buckets, ([weekStart, count]) => ({ weekStart, count })).sort((a, b) =>
    a.weekStart.localeCompare(b.weekStart)
  );

  const cycles = listCycles(workspacePath);
  const cycleReadiness: CycleReadiness[] = cycles.map((cycle) => {
    let readyCount = 0;
    for (const person of people) {
      const cycleNotes = listAllNotes(workspacePath, { person: person.record.name, cycle: cycle.name });
      const overview = overviews.find((o) => o.personName === person.record.name)!;
      const coveredTags = new Set(cycleNotes.map((n) => n.frontmatter.tag).filter(Boolean));
      const allCovered = overview.sections.every((s) => coveredTags.has(s.tagId));
      if (allCovered) readyCount++;
    }
    return { cycleName: cycle.name, readyCount, totalPeople: people.length };
  });

  return { coverage, goingStale, cadence, cycleReadiness };
}

export function buildStalenessNudgeText(workspacePath: string, asOf: Date = new Date()): string | null {
  const { goingStale } = buildInsights(workspacePath, asOf);
  if (goingStale.length === 0) return null;

  const uniqueNames = Array.from(new Set(goingStale.map((s) => s.personName)));
  const verb = uniqueNames.length === 1 ? "has" : "have";
  const noun = uniqueNames.length === 1 ? "person" : "people";
  return `${uniqueNames.length} ${noun} ${verb} gaps in their evidence (stale or missing 30+ days): ${uniqueNames.join(", ")}`;
}
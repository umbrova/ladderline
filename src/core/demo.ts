import { trackPerson } from "./people.js";
import { addCycle } from "./cycles.js";
import { addNote } from "./notes.js";

function daysFromToday(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export function seedDemoData(workspacePath: string): void {
  addCycle(workspacePath, "demo-cycle", daysFromToday(-45), daysFromToday(45));

  trackPerson(workspacePath, "Demo Person", { ladder: "generic-ic-ladder.yaml", as: "report" });

  addNote(workspacePath, "Demo Person", {
    tag: "technical-execution",
    date: daysFromToday(-18),
    text: "[DEMO] Shipped the migration to the new build pipeline ahead of schedule.",
  });
  addNote(workspacePath, "Demo Person", {
    tag: "technical-direction",
    date: daysFromToday(-9),
    text: "[DEMO] Proposed the caching strategy that two other teams later adopted.",
  });
  addNote(workspacePath, "Demo Person", {
    tag: "mentorship",
    date: daysFromToday(-3),
    text: "[DEMO] Paired weekly with a newer teammate for the past month.",
  });

  // "reliability" deliberately left with zero notes — shows a real gap.
}
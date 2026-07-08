import express from "express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { listTrackedPeople } from "../core/people.js";
import { buildPersonOverview } from "../core/overview.js";
import { buildTeamGrid } from "../core/team-grid.js";
import { listAllNotes } from "../core/notes.js";
import { LadderlineError } from "../core/errors.js";
import { buildInsights } from "../core/insights.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createDashboardServer(workspacePath: string) {
  const app = express();

  app.get("/api/people", (req, res) => {
    const people = listTrackedPeople(workspacePath).map((p) => ({
      slug: p.slug,
      name: p.record.name,
      ladder: p.record.ladder,
      as: p.record.as,
    }));
    res.json(people);
  });

  app.get("/api/people/:slug/overview", (req, res) => {
    try {
      const match = listTrackedPeople(workspacePath).find((p) => p.slug === req.params.slug);
      if (!match) {
        res.status(404).json({ error: `No tracked person with slug "${req.params.slug}"` });
        return;
      }
      const overview = buildPersonOverview(workspacePath, match.record.name);
      res.json(overview);
    } catch (err) {
      if (err instanceof LadderlineError) {
        res.status(400).json({ error: err.message });
        return;
      }
      throw err;
    }
  });

  app.get("/api/team-grid", (req, res) => {
    res.json(buildTeamGrid(workspacePath));
    });

app.get("/api/notes", (req, res) => {
  const { person, tag, cycle, notagOnly } = req.query;
  const notes = listAllNotes(workspacePath, {
    person: typeof person === "string" ? person : undefined,
    tag: typeof tag === "string" ? tag : undefined,
    cycle: typeof cycle === "string" ? cycle : undefined,
    notagOnly: notagOnly === "true",
  });
  res.json(
    notes.map((n) => ({
      personName: n.personName,
      filename: n.filename,
      tag: n.frontmatter.tag,
      date: n.frontmatter.date,
      cycle: n.frontmatter.cycle,
      body: n.body,
    }))
  );
});

  app.get("/api/insights", (req, res) => {
    res.json(buildInsights(workspacePath));
  });

  

  app.use(express.static(join(__dirname, "public")));

  return app;
}
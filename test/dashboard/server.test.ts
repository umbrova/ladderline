import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Server } from "node:http";
import { createWorkspace } from "../../src/core/workspace.js";
import { trackPerson } from "../../src/core/people.js";
import { addNote } from "../../src/core/notes.js";
import { createDashboardServer } from "../../src/dashboard/server.js";

describe("dashboard server (real HTTP requests, not mocked)", () => {
  let testDir: string;
  let workspace: string;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    testDir = mkdtempSync(join(tmpdir(), "ladderline-test-"));
    workspace = createWorkspace(testDir);
    trackPerson(workspace, "Sarah Chen", { ladder: "generic-ic-ladder.yaml", as: "report" });
    addNote(workspace, "Sarah Chen", { tag: "reliability", date: "2026-02-10", text: "Owns the notifications service" });

    const app = createDashboardServer(workspace);
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(() => {
    server.close();
    rmSync(testDir, { recursive: true, force: true });
  });

  it("GET /api/people returns the tracked person", async () => {
    const res = await fetch(`${baseUrl}/api/people`);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual([
      { slug: "sarah-chen", name: "Sarah Chen", ladder: "generic-ic-ladder.yaml", as: "report" },
    ]);
  });

  it("GET /api/people/:slug/overview returns the right shape", async () => {
    const res = await fetch(`${baseUrl}/api/people/sarah-chen/overview`);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.personName).toBe("Sarah Chen");
    const reliability = body.sections.find((s: any) => s.tagId === "reliability");
    expect(reliability.noteCount).toBe(1);
  });

  it("returns 404 for an unknown person slug", async () => {
    const res = await fetch(`${baseUrl}/api/people/nobody/overview`);
    expect(res.status).toBe(404);
  });

  it("GET /api/team-grid returns tags and rows", async () => {
    const res = await fetch(`${baseUrl}/api/team-grid`);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.rows).toHaveLength(1);
    expect(body.rows[0].name).toBe("Sarah Chen");
  });

  it("GET /api/notes returns notes, filterable by query params", async () => {
    const all = await (await fetch(`${baseUrl}/api/notes`)).json();
    expect(all).toHaveLength(1);

    const filtered = await (await fetch(`${baseUrl}/api/notes?tag=mentorship`)).json();
    expect(filtered).toHaveLength(0);
  });

  it("GET /api/insights returns the four expected metric groups", async () => {
    const res = await fetch(`${baseUrl}/api/insights`);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toHaveProperty("coverage");
    expect(body).toHaveProperty("goingStale");
    expect(body).toHaveProperty("cadence");
    expect(body).toHaveProperty("cycleReadiness");
  });
});
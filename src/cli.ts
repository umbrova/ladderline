#!/usr/bin/env node
import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { runLadderList, runLadderAdd, runLadderRemove } from "./commands/ladder.js";
import { runTrack } from "./commands/track.js";
import { runUntrack } from "./commands/untrack.js";
import { runNote } from "./commands/note.js";
import { runNoteDelete } from "./commands/note-delete.js";
import { runCycleAdd, runCycleList, runCycleRemove } from "./commands/cycle.js";
import { runCase } from "./commands/case.js";
import { runNotagList } from "./commands/notag.js";
import { runExport } from "./commands/export.js";
import { runImport } from "./commands/import.js";
import { runDashboard } from "./commands/dashboard.js";
import { findWorkspaceRoot } from "./core/workspace.js";
import { buildStalenessNudgeText } from "./core/insights.js";

const program = new Command();

program
  .name("ladderline")
  .description("Track career-ladder evidence, locally, as it happens.")
  .version("0.1.0");

program.hook("preAction", (thisCommand, actionCommand) => {
  if (actionCommand.name() === "init") return;
  try {
    const workspace = findWorkspaceRoot();
    const nudge = buildStalenessNudgeText(workspace);
    if (nudge) console.log(`ℹ ${nudge}\n`);
  } catch {
    // no workspace yet, or nothing tracked — nothing to nudge about
  }
});

program
  .command("init")
  .description("Create a new Ladderline workspace in the current folder")
  .option("--demo", "also seed an obviously-fake demo person and notes")
  .action((options) => {
    runInit(options);
  });

const ladderCmd = program.command("ladder").description("Manage career ladder files");

ladderCmd
  .command("list")
  .description("Show ladders registered in this workspace")
  .action(() => {
    runLadderList();
  });

ladderCmd
  .command("add <file>")
  .description("Register a ladder file into this workspace")
  .action((file: string) => {
    runLadderAdd(file);
  });

ladderCmd
  .command("remove <file>")
  .description("Remove a registered ladder")
  .option("--force", "remove even if people are still assigned to it")
  .action((file: string, options: { force?: boolean }) => {
    runLadderRemove(file, options);
  });

program
  .command("track <name>")
  .description("Start tracking a person")
  .requiredOption("--ladder <file>", "which registered ladder applies to this person")
  .requiredOption("--as <relationship>", "report | self | mentee | cross-team | peer")
  .action((name: string, options: { ladder: string; as: string }) => {
    runTrack(name, options);
  });

program
  .command("untrack <name>")
  .description("Stop tracking a person (archives by default, --purge to delete permanently)")
  .option("--purge", "permanently delete all data for this person, asks twice to confirm")
  .action(async (name: string, options: { purge?: boolean }) => {
    await runUntrack(name, options);
  });

program
  .command("note <text>")
  .description("Log a single evidence note against a tracked person")
  .requiredOption("--person <name>", "the tracked person this note is about")
  .option("--tag <id>", "a competency id from the person's ladder")
  .option("--notag", "save without a tag, for something not yet mapped to a competency")
  .option("--date <date>", "YYYY-MM-DD, defaults to today")
  .action((text: string, options: { person: string; tag?: string; notag?: boolean; date?: string }) => {
    runNote(options.person, text, { tag: options.tag, notag: options.notag, date: options.date });
  });

program
  .command("note-delete")
  .description("Delete a single note (always confirms first)")
  .requiredOption("--person <name>", "the tracked person this note belongs to")
  .requiredOption("--date <date>", "YYYY-MM-DD")
  .option("--tag <id>", "the tag on the note to delete")
  .option("--notag", "delete a notag entry instead of a tagged one")
  .option("--filename <name>", "pick an exact file if --tag/--date matches more than one")
  .action(async (options: { person: string; date: string; tag?: string; notag?: boolean; filename?: string }) => {
    await runNoteDelete(options.person, options);
  });

const cycleCmd = program.command("cycle").description("Manage review cycles");

cycleCmd
  .command("add <name>")
  .description("Define a named review period")
  .requiredOption("--start <date>", "YYYY-MM-DD")
  .requiredOption("--end <date>", "YYYY-MM-DD")
  .action((name: string, options: { start: string; end: string }) => {
    runCycleAdd(name, options);
  });

cycleCmd
  .command("list")
  .description("Show defined cycles")
  .action(() => {
    runCycleList();
  });

cycleCmd
  .command("remove <name>")
  .description("Remove a defined cycle")
  .action((name: string) => {
    runCycleRemove(name);
  });

program
  .command("case [name]")
  .description("Assemble a case for one person, or all tracked people with --all")
  .requiredOption("--cycle <name>", "which defined cycle to pull notes from")
  .option("--format <format>", "docx (default) or md", "docx")
  .option("--all", "generate for every tracked person (optionally filtered with --as)")
  .option("--as <relationship>", "with --all, only report | self | mentee | cross-team | peer")
  .option("--prompt", "also write a sibling .prompt.txt for pasting into an LLM")
  .action(async (name: string | undefined, options: { cycle: string; format: "docx" | "md"; all?: boolean; as?: string; prompt?: boolean }) => {
    if (!options.all && !name) {
      console.error("✗ Provide a person's name, or use --all to generate for everyone.");
      process.exitCode = 1;
      return;
    }
    await runCase(name ?? "", options);
  });

const notagCmd = program.command("notag").description("Manage untagged notes");

notagCmd
  .command("list")
  .description("List notag entries, optionally for one person")
  .option("--person <name>", "only show notag entries for this person")
  .action((options: { person?: string }) => {
    runNotagList(options);
  });

program
  .command("export")
  .description("Zip the workspace (or a filtered slice of it) for backup or sharing")
  .option("--person <name>", "only export this person's notes")
  .option("--cycle <name>", "only export notes from this cycle, across everyone")
  .option("--since <date>", "only export notes logged on or after this date (YYYY-MM-DD)")
  .action((options: { person?: string; cycle?: string; since?: string }) => {
    runExport(options);
  });

program
  .command("import <file>")
  .description("Restore or merge a workspace from an exported zip")
  .option("--force", "overwrite files that already exist with different content")
  .action((file: string, options: { force?: boolean }) => {
    runImport(file, options);
  });

program
  .command("dashboard")
  .description("Launch the local web dashboard")
  .option("--port <port>", "port to listen on", "4200")
  .action((options: { port?: string }) => {
    runDashboard(options);
  });

program.parse(process.argv);

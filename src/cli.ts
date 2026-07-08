#!/usr/bin/env node
import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { runLadderList, runLadderAdd } from "./commands/ladder.js";
import { runTrack } from "./commands/track.js";
import { runNote } from "./commands/note.js";
import { runCycleAdd, runCycleList } from "./commands/cycle.js";
import { runCase } from "./commands/case.js";

const program = new Command();

program
  .name("ladderline")
  .description("Track career-ladder evidence, locally, as it happens.")
  .version("0.1.0");

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

program
  .command("track <name>")
  .description("Start tracking a person")
  .requiredOption("--ladder <file>", "which registered ladder applies to this person")
  .requiredOption("--as <relationship>", "report | self | mentee | cross-team | peer")
  .action((name: string, options: { ladder: string; as: string }) => {
    runTrack(name, options);
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

program.parse(process.argv);

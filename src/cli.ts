#!/usr/bin/env node
import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { runLadderList, runLadderAdd } from "./commands/ladder.js";
import { runTrack } from "./commands/track.js";

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

program.parse(process.argv);

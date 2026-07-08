#!/usr/bin/env node
import { Command } from "commander";
import { runInit } from "./commands/init.js";

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

program.parse(process.argv);

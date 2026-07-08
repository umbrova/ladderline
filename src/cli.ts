#!/usr/bin/env node
import { Command } from "commander";

const program = new Command();

program
  .name("ladderline")
  .description("Track career-ladder evidence, locally, as it happens.")
  .version("0.1.0");

program.parse(process.argv);

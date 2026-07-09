import { createWorkspace } from "../core/workspace.js";
import { seedDemoData } from "../core/demo.js";
import { printSuccess, printErrorAndSetExitCode } from "./output.js";

const BANNER = [
  "                                   ",
  " _       _   _         _ _         ",
  "| |___ _| |_| |___ ___| |_|___ ___ ",
  "| | .'| . | . | -_|  _| | |   | -_|",
  "|_|__,|___|___|___|_| |_|_|_|_|___|",
  "                                   ",
].join("\n");

export function runInit(options: { demo?: boolean }): void {
  try {
    const path = createWorkspace(process.cwd());
    console.log(BANNER);
    printSuccess(`Created workspace at ${path}`);
    printSuccess(`Added default ladder: generic-ic-ladder.yaml`);

    if (options.demo) {
      seedDemoData(path);
      printSuccess(`Seeded demo data: "Demo Person" with 3 notes (and one deliberate gap)`);
    }

    console.log(`
Next steps:
  1. ladderline track "Name" --ladder generic-ic-ladder.yaml --as report
  2. ladderline note "what happened" --person "Name" --tag <competency-id>
  3. ladderline dashboard

Full docs: https://github.com/umbrova/ladderline/wiki`);
  } catch (err) {
    printErrorAndSetExitCode(err);
  }
}
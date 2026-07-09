import chalk from "chalk";
import { LadderlineError } from "../core/errors.js";

// A long debugging session traced a real "no color" bug on Windows to a
// stale npm symlink resolution (fixed by `npm rm -g` + `npm link` again) —
// once that was fixed, isTTY reported correctly even through npm's .cmd
// shim wrapper. We never got a clean, isolated test of isTTY alone (without
// this fallback) on a correctly-linked install, so it's unconfirmed whether
// isTTY is fully reliable through the shim in every case. MSYSTEM (set by
// Git Bash) is kept as a low-cost fallback signal — redundant in the common
// case, but cheap insurance against an isTTY edge case we haven't isolated.
// Trade-off: this can't distinguish "a real interactive Git Bash window"
// from "Git Bash, but output redirected to a file" — both have MSYSTEM
// set — so color could leak into a redirected log file in that rare case.
const isInteractive = Boolean(process.stdout.isTTY) || Boolean(process.env.MSYSTEM);
chalk.level = isInteractive ? 3 : 0;

export function printSuccess(message: string): void {
  console.log(chalk.green("✓") + " " + message);
}

export function printWarning(message: string): void {
  console.warn(chalk.yellow("⚠") + " " + message);
}

export function printErrorAndSetExitCode(err: unknown): void {
  if (err instanceof LadderlineError) {
    console.error(chalk.red("✗") + " " + err.message);
    if (err.suggestion) console.error("  " + err.suggestion);
    process.exitCode = 1;
    return;
  }
  throw err;
}
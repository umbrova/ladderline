import { findWorkspaceRoot } from "../core/workspace.js";
import { trackPerson } from "../core/people.js";
import { printSuccess, printErrorAndSetExitCode } from "./output.js";

export function runTrack(name: string, options: { ladder: string; as: string }): void {
  try {
    const workspace = findWorkspaceRoot();
    trackPerson(workspace, name, options);
    printSuccess(`Now tracking "${name}" (${options.as}) against ${options.ladder}`);
  } catch (err) {
    printErrorAndSetExitCode(err);
  }
}
// Shared base class for every Ladderline-specific, "expected" error.
// Commands throw these; a single catch-all in cli.ts renders them as
// ✗ <message> / <suggestion> instead of a raw stack trace.
//
// This file starts small on purpose — it grows in Phase 4 once `note`
// needs "did you mean" fuzzy matching. Starting it now (rather than
// waiting) means `init` already follows the refuse-and-explain
// philosophy from day one, instead of a special case being bolted on later.

export class LadderlineError extends Error {
  constructor(message: string, public suggestion?: string) {
    super(message);
  }
}

export class WorkspaceAlreadyExistsError extends LadderlineError {
  constructor(path: string) {
    super(
      `A Ladderline workspace already exists at ${path}.`,
      `Nothing was changed. Delete that folder first if you really want to start over.`
    );
  }
}

export class WorkspaceNotFoundError extends LadderlineError {
  constructor() {
    super(
      `No Ladderline workspace found here or in any parent folder.`,
      `Run: ladderline init`
    );
  }
}

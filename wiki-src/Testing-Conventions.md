# Testing Conventions

## Test runner: Vitest

Chosen over Jest and Node's built-in `node:test` because TypeScript works without extra configuration (no `ts-jest`, no babel setup), it's fast (esbuild-based), and the `describe/it/expect` API needs no learning curve for anyone coming from Jest.

## Two layers of tests, mirroring `src/`

```
test/
├── core/
│   ├── ladder.test.ts        # mirrors src/core/ladder.ts
│   ├── notes.test.ts
│   └── errors.test.ts
└── commands/
    ├── track.test.ts         # mirrors src/commands/track.ts
    ├── note.test.ts
    └── case.test.ts
```

**Unit tests** (`test/core/*.test.ts`) — pure logic, no filesystem involved. Tag matching, "did you mean" fuzzy suggestions, cycle-date boundary math.

**Command tests** (`test/commands/*.test.ts`) — call the command function directly against a real temporary directory, not a filesystem mock, and assert on the actual files written. This is more honest than mocking, since it proves the file gets written correctly rather than just that a mock was called.

## Command test pattern

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";

describe("note command", () => {
  let workspaceDir: string;

  beforeEach(() => {
    workspaceDir = mkdtempSync(path.join(tmpdir(), "ladderline-test-"));
    // set up a workspace + tracked person here
  });

  afterEach(() => {
    rmSync(workspaceDir, { recursive: true, force: true });
  });

  it("writes a note file with the correct frontmatter", () => { /* ... */ });
  it("refuses to log a note for an untracked person", () => { /* ... */ });
  it("rejects an invalid tag with a suggestion", () => { /* ... */ });
});
```

## What's deliberately NOT covered by command tests

A small number of true end-to-end tests spawn the actual published `ladderline` binary as a subprocess, to sanity-check that the CLI wiring itself works — but this is kept to a handful of smoke tests, not the primary way logic gets tested, since subprocess tests are slower and less informative about *why* something failed.

## One test file per source file

Every file in `src/` has a corresponding file in `test/`, named identically with `.test.ts`. If a new source file doesn't have a matching test file, that's a signal review should catch before merging.

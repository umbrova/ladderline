# Error Handling

## Guiding principle

Ladderline's core promise is "never invent, never lose evidence." The error philosophy follows the same spirit: **refuse and explain, rather than guess and proceed.** This is a stricter posture than most CLI tools default to, because a silent mistake here doesn't just cost a developer a few minutes — it can quietly cost someone their promotion evidence.

## Rules

**Fail loudly, never silently.**
- Logging a note for an untracked person refuses, rather than silently creating a phantom person or dropping the note.
- Generating a case with zero notes in the given cycle refuses, rather than producing an empty but official-looking document.
- A malformed ladder YAML file points at the specific file/field — never a raw parser stack trace.

**Suggest, don't just reject.**
- Typos in `--tag`, person names, ladder filenames, or cycle names get a "did you mean" suggestion. This is handled by one shared helper (see below), applied consistently everywhere an identifier is typed — not reimplemented per command.

**Confirm before anything destructive or ambiguous.**
- `import` prompts explicitly (merge / skip / overwrite) when incoming data overlaps with the existing workspace.
- Any command that would delete a note or a person asks first. There is no built-in undo in a plain-files tool unless the user is also using git on the workspace, so accidental loss is unusually costly here.

**Unexpected errors are never swallowed.** Only known, anticipated problems (untracked person, invalid tag, empty case) get the friendly ✗/⚠ treatment. A genuine bug still surfaces a real stack trace — hiding it behind a pretty message would mask real problems instead of just handling expected ones.

## Implementation: `src/core/errors.ts`

All Ladderline-specific errors extend one base class:

```ts
export class LadderlineError extends Error {
  constructor(message: string, public suggestion?: string) {
    super(message);
  }
}
```

Concrete errors (`PersonNotTrackedError`, `InvalidTagError`, `EmptyCaseError`, etc.) extend this and carry their own message + suggestion. The shared `findClosestMatch()` fuzzy-matching function lives in the same file and powers every "did you mean" — tags, person names, ladder filenames, cycle names alike.

Commands only ever `throw` — they never format or print anything themselves. A single catch-all at the top of `src/cli.ts` renders the output:

```ts
try {
  await runCommand(args);
} catch (err) {
  if (err instanceof LadderlineError) {
    console.error(`✗ ${err.message}`);
    if (err.suggestion) console.error(`  ${err.suggestion}`);
    process.exit(1);
  }
  throw err; // unexpected bugs still surface a real stack trace
}
```

## Message format

```
✗ <what went wrong, plainly stated>
  <the suggested fix, if there is one>
```

```
⚠ <a non-blocking warning — something that should be reviewed but doesn't stop the command>
```

Keep both lines short. The suggestion line, when present, should be something the person can act on immediately (a runnable command, a corrected spelling) rather than a vague pointer to "check your input."

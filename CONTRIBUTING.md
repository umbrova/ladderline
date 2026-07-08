# Contributing to Ladderline

Thanks for taking a look — this is an early-stage OSS project, so contributions of any size are welcome: bug reports, small fixes, documentation improvements, or larger feature discussions.

## Where things go

- **Bugs / concrete problems** → [GitHub Issues](../../issues).
- **Feature ideas, usage questions, "here's how I use it"** → [GitHub Discussions](../../discussions), kept separate from Issues so the bug tracker stays focused.

## Before opening a PR

- Check the [wiki](../../wiki) first — [[Terminology]], [[Naming-Conventions]], and [[Error-Handling]] cover conventions that are treated as fixed unless discussed first. New code should reuse existing terms rather than introducing synonyms.
- Every file in `src/` should have a matching test file in `test/`, using the same relative path with `.test.ts` appended. See the wiki's [[Testing-Conventions]] page for the unit-test vs. command-test split and the temp-workspace pattern used for command tests.
- Run the test suite before opening a PR:
npm test

## Core principle to keep in mind

Ladderline's whole value rests on **never inventing, never losing evidence** — cases are assembled only from what was actually logged, gaps are shown honestly, and nothing is auto-summarized or scored. If a contribution touches the case builder, the Insights tab, or anything evidence-related, this is the test to apply: does it stay strictly descriptive/extractive, or does it start making a judgment the tool has no business making?

## Questions

Open a Discussion — no need to have a fully-formed idea before asking.
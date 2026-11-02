# Learning Artifact Preparation

Read this reference only when the learner explicitly asks to create or update
persistent learning materials such as README content, teaching tests, fixtures,
scripts, onboarding notes, or course exercises.

## Round 1: Read-only Discovery and Exact Preview

Inspect the target repository without changing files, installing dependencies,
starting services, or running scenarios that can mutate local or remote state.

Return:

1. The detected project, learning goal, and assumed mastery level.
2. A verified architecture summary and the narrow scope being taught.
3. Exact source and test files that provide the evidence.
4. An exact table of files to create, update, or leave unchanged, with the
   stable learning value of every proposed change.
5. Proposed unit, hermetic scenario, local E2E, or remote smoke demonstrations,
   including which dependencies are real or fake and what each proves.
6. Expected commands, services, credentials, containers, package changes, and
   possible external effects.
7. Risks, non-goals, and anything the preparation will not validate.

Name exact paths. If existing README content or tests are already sufficient,
explicitly propose no change instead of creating work for consistency.

End with a request to confirm or revise the proposed scope. Do not edit files in
the same turn. A question or revised learning goal is not authorization to edit.

## Round 2: Confirmed Local Updates

Treat an explicit reply such as "confirm", "continue", or "update the files" as
approval only for the local file changes and ordinary local validation commands
listed in the latest preview.

After confirmation:

1. Recheck target files and preserve unrelated user changes.
2. Apply only the approved README, teaching-test, fixture, script, or config
   changes.
3. Keep README content navigational and teaching tests behavior-oriented.
4. Run the approved deterministic validation in proportion to the change.
5. Report exactly what changed, what passed, and what remains unverified.
6. Continue the teaching workflow with the first prediction question or
   executable lesson.

If implementation reveals a materially different file list, dependency,
service, credential, container, cost, or external mutation, stop and return an
amended preview for another confirmation. Approval for local files never grants
authority for remote, credentialed, costly, or destructive actions.

## Useful Learning Artifacts

Prefer artifacts that remain valuable after the current conversation:

- A README learning map with purpose, entrypoints, architecture boundaries,
  success and failure paths, tradeoffs, commands, and reading order.
- Teaching tests with one observable behavior or invariant per scenario.
- Small explicit fixtures that reveal inputs, outputs, and state transitions.
- Reconstruction exercises with a clear contract and bounded scope.

Do not turn the README into a line-by-line reference or copy transient discussion
into it. Add only stable knowledge that helps future learners navigate the
system, predict behavior, or reproduce an important scenario.

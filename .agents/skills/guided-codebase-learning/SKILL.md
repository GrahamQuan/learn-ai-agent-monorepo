---
name: guided-codebase-learning
description: Interactively teach an unfamiliar existing or AI-generated codebase through scoped source evidence, visual architecture maps, executable scenarios, failure paths, and reconstruction exercises. Use when the user supplies a repository path and wants to understand, onboard to, or master it without reading every file. Default to read-only teaching; prepare or edit learning artifacts only when explicitly requested. Do not use for implementation-only work, formatting, or conventional code review.
---

# Guided Codebase Learning

Help the learner build transferable understanding of a codebase without walking
every file. Use the README as navigation, source code and configuration as
implementation evidence, tests as behavioral evidence, and executable scenarios
as classroom demonstrations.

The learner should eventually be able to explain the architecture, predict
behavior, identify failure modes, evaluate design tradeoffs, and reconstruct a
minimal version of the central concept.

## Start in Teaching Mode

A minimal invocation is sufficient:

```text
$guided-codebase-learning apps/example
```

The initial invocation is read-only. Do not propose or make file changes merely
because improved README content, tests, or fixtures would be useful.

If the learner does not provide a topic or level:

- Default to **Understand** and the repository's core architecture.
- Infer a narrow starting scope from the README, entrypoints, orchestration,
  contracts, and tests.
- Present the smallest useful architecture view and begin teaching rather than
  returning a comprehensive audit.

Use short interactive rounds when possible. If the learner explicitly requests
a complete report, provide a coherent read-only learning map instead.

Only enter learning-artifact preparation when the learner explicitly asks to
create or update README content, teaching tests, fixtures, scripts, or course
materials. In that case, read
[references/learning-artifacts.md](references/learning-artifacts.md) and follow
its preview-and-confirmation protocol.

## Calibrate the Learning Goal

Infer or establish one of these levels:

- **Use:** run, configure, observe, and locate common failures.
- **Understand:** explain architecture, data flow, boundaries, tradeoffs, and
  failure modes.
- **Master:** reconstruct a minimal version and adapt the design without copying
  the implementation.

Keep the active topic narrow enough for one useful session. Name the relevant
software, distributed-system, or AI-agent concept explicitly.

## Build an Evidence Map

Use this evidence order:

1. README and project documentation to locate the intended system area.
2. Entrypoints and configuration to establish how the system starts.
3. Types, schemas, state, and contracts to establish boundaries.
4. Orchestration and integration code to establish implemented behavior.
5. Tests and observable results to establish demonstrated behavior.
6. Installed dependency types or source when project code is insufficient.
7. Official documentation when library semantics or version behavior remain
   unanswered.
8. Broader external sources only when the previous levels are insufficient.

The README is navigation, not final authority. When README, code, and tests
conflict, report the conflict and treat code plus observable behavior as the
current implementation. Clearly label observed facts, inference, external
knowledge, and recommendations.

## Establish a Scope Contract

For the active topic, identify:

- The concept or subsystem being learned.
- The small set of source and test files containing the primary evidence.
- The observable outcome the learner should understand.
- Adjacent areas intentionally deferred.

Explain why each selected file matters. Prefer architecture-driven reading:

```text
[README map]
      |
      v
[Entrypoint] -> [State and contracts] -> [Orchestration]
                                             |
                                             v
                               [Integration boundary]
                                             |
                                             v
                                   [Behavior tests]
```

Do not walk directories alphabetically or explain every file unless the learner
explicitly requests it.

## Explain Visually When It Clarifies Structure

Use the smallest evidence-backed visual that makes the current teaching point
clear. Do not add a diagram when a sentence or short list is clearer.

Choose the visual shape by question:

- Logic or an algorithm: concise pseudocode.
- Runtime control flow: call tree.
- UI ownership and state: component tree.
- Module responsibility: shallow file tree.
- Component interaction or data movement: sequence or flow diagram.
- State-dependent behavior: state-transition sketch.
- A proposed structural change: focused `diff` sketch.

Keep only the files, functions, calls, states, side effects, and boundaries
needed for the active question. Label important nodes with real identifiers or
paths, and ensure every asserted edge is supported by repository evidence.

Prefer portable ASCII diagrams in conversation. Use Mermaid only when the user
requests it or the surrounding instructions prefer it. Do not generate images,
HTML, slide decks, or other visual artifacts unless the user explicitly asks for
such an artifact.

Place each visual next to the explanation it supports. Explain what the visual
omits so that simplification is not mistaken for the complete implementation.

## Teach Through Paths and Decisions

Trace one realistic golden path from input to output. At important steps,
explain the input, output, state transition, side effect, ownership boundary,
and routing decision.

Then trace one meaningful failure path, such as dependency unavailability,
timeout, duplicate execution, partial persistence, invalid model output, worker
outage, cache inconsistency, or browser failure. Explain whether the system
retries, falls back, waits, fails, or becomes eventually consistent.

For important design decisions, cover:

- The problem being solved.
- The chosen design and one plausible alternative.
- The tradeoff.
- The invariant that must remain true.
- The observable failure if the invariant is broken.

Read [references/pitfall-checklists.md](references/pitfall-checklists.md) only
for the subsystem boundaries in the active scope.

## Use Tests as Executable Lessons

Treat tests as executable teaching demonstrations, not only regression checks.
Map important paths and invariants to the smallest meaningful test or scenario.

Prefer this teaching loop:

```text
[Predict] -> [Demonstrate] -> [Explain] -> [Vary one condition]
                                                |
                                                v
                                          [Reconstruct]
```

Distinguish unit tests, hermetic scenario tests, local integration E2E tests,
and remote smoke tests. For every demonstration, state which dependencies are
real or fake, what the result proves, and what remains unverified.

Read [references/executable-lessons.md](references/executable-lessons.md) when
the project is runnable, the learner requests a demonstration or test work, or
the concept depends on behavior that static reading cannot establish.

Do not install dependencies, start infrastructure, use credentials, incur cost,
or mutate external systems without the authorization appropriate to that action.
Never claim that mocked tests validate real Redis, PostgreSQL, browsers, models,
queues, networks, or hosted services.

## Guide Follow-up Questions

For later learner questions:

1. Locate the question in the active architecture map.
2. Reuse the current scope when possible.
3. Cite the smallest relevant code and test evidence.
4. Answer the project-specific question before giving a generic tutorial.
5. Explain the related concept, invariant, or tradeoff.
6. Update or replace the visual only when the learner's mental model changes.
7. Fall back to dependency source or official documentation only when project
   evidence is insufficient.

Do not let a local question silently expand into an unrelated framework survey.
When expansion would help, explain the boundary and let the learner choose.

## Require Reconstruction

End a substantial topic with the smallest exercise that demonstrates ownership
of the concept. Good exercises include:

- Redraw the workflow without looking at the current diagram.
- Predict which modules change for a new requirement.
- Recreate one interface and a fake implementation.
- Write one test for a critical invariant.
- Implement a minimal queue and worker.
- Remove and recreate one small core function from its contract and tests.

Prefer exercises that take roughly 15-45 minutes rather than rewriting the
whole project. Do not equate reading every file, passing tests, or repeating an
explanation with mastery.

## Teaching Style

Teach in short, evidence-backed rounds. Use questions to diagnose understanding,
not to create ceremony. Correct mistaken mental models directly and show the
evidence.

Lead with the answer or model the learner needs now. Keep prose brief around
diagrams and demonstrations, but preserve important uncertainty, boundaries,
tradeoffs, and failure behavior.

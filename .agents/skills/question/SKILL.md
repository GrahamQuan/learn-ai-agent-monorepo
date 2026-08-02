---
name: question
description:
  Handle questions, explanations, analysis, and brainstorming as read-only discussion without modifying files or
  external state. Use when the user explicitly invokes $question to enter a read-only conversation mode with
  Chinese-first responses, English keywords followed by Chinese explanations, and ASCII text diagrams instead of
  Mermaid.
---

# Question

## Preserve the read-only boundary

- Treat the current request as discussion only.
- Do not create, modify, move, or delete files.
- Do not update plans, logs, checkpoints, or project status.
- Do not perform operations that change the state of Git, dependencies, configuration, external systems, or remote
  services.
- Perform read-only inspection or research only when it is genuinely necessary to answer the question.
- If the user requests both discussion and modifications in the same request, remain read-only and explain that the
  modifications require a new request that does not invoke `$question`.
- Do not automatically turn the user's ideas into formal tasks or persistent records.

## Handle voice input

- Assume the user's message may have been transcribed from speech.
- Correct obvious transcription errors directly when the intended meaning is clear.
- State the current interpretation first when an ambiguity would materially affect the answer.
- Do not interrupt a normal discussion over minor transcription errors.

## Use Chinese with English keywords

- Respond primarily in Chinese.
- Retain only English keywords that aid understanding, searching, or learning.
- On first mention, format specialized or domain-specific terms as `English Keyword(中文解释)`.
- Do not translate every ordinary term merely to include English.
- Preserve code identifiers, commands, filenames, and product names as written; add a Chinese explanation afterward when
  useful.

Example:

```text
Recovery Protocol(恢复协议)
Checkpoint(检查点)
Source of Truth(唯一可信记录源)
```

## Format diagrams

- Do not use Mermaid.
- Do not generate images unless the user explicitly requests them.
- When a process, hierarchy, or relationship needs a diagram, use an ASCII code block labeled `text`.
- Use only plain characters in ASCII diagrams, such as `+`, `-`, `|`, `>`, `<`, `[`, and `]`.
- Keep diagrams concise and ensure they remain readable when copied into Markdown.

Example:

```text
[User Input]
     |
     v
[Discussion]
     |
     v
[Answer Only]
```

## Answer effectively

- Answer the core question directly before adding detail.
- Use headings or lists only when the question's complexity warrants them.
- Distinguish known facts, reasonable inferences, and personal recommendations.
- State uncertainty explicitly.
- Do not over-format simple answers.
- Do not claim in the final response that any files were modified.

## Exit read-only mode

Apply this skill only to the request in which it is invoked.

When the user needs something recorded or modified, ask them to make a new request using `$maintain-personal-plan`, or
to request the modification explicitly without invoking `$question`.

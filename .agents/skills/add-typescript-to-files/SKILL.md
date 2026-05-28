---
name: add-typescript-to-files
description: Add or fix TypeScript annotations in existing files without changing runtime logic. Use when the user invokes /add-typescript-to-files or $add-typescript-to-files, provides one or more file paths, folders, globs, or numbered file ranges, and asks to fix implicit any, unknown, never, generic inference, callback, or API typing errors while preserving simple learning code and preferring existing library types.
---

# Add TypeScript To Files

## Goal

Add the smallest useful TypeScript annotations to the requested files so they typecheck, while keeping runtime logic unchanged.

## Input Handling

- Accept one file path, many file paths, newline or bullet lists, folders, globs, and simple numbered ranges such as "files 10 to 12".
- Resolve folders and ranges with `rg --files` first. Confirm the final target set from local files, not memory.
- If the target set is ambiguous and multiple reasonable interpretations could change different files, ask one concise clarifying question.

## Workflow

1. Read the requested files before editing.
2. Find the nearest package/typecheck command from `package.json` and `tsconfig.json`.
3. Run typecheck when practical to capture the real compiler errors. If the whole package has unrelated errors, focus only on errors in the requested files and say so.
4. Patch only type-level concerns:
   - function parameter and return annotations
   - API generic parameters
   - `type` imports
   - safe casts or non-null assertions that express an existing invariant
   - object index types such as `Record<string, string>` when needed
5. Re-run typecheck or a targeted compiler command after editing.
6. Final response: name changed files, state that logic was preserved, and report the verification command.

## Rules

- Do not refactor, rename, reorder behavior, change control flow, change data flow, or introduce new runtime branches.
- Do not create new named app-local types or interfaces unless the user explicitly asks. Prefer inline structural types for tiny examples.
- Prefer types from the relevant library/framework over invented types.
- Use `import type` for type-only imports.
- Keep examples simple and readable; this skill often supports learning code.
- Use `apply_patch` for manual edits.
- Do not fix unrelated files unless the user expands the scope.

## LangChain Runnable Hints

When the files use LangChain Runnable APIs, prefer the Runnable generics and exported LangChain types:

- `RunnableLambda.from<Input, Output>(...)`
- `new RunnableLambda<Input, Output>({ func })`
- `RunnableSequence.from<Input, Output>(...)` when sequence boundaries need help
- `RunnableBranch.from<Input, Output>(...)` when branch outputs must align
- `RunnableConfig<ConfigurableFields>` for `config.configurable`
- `Runnable<Input, Output>` for fallback arrays
- `CallbackHandlerMethods` for callbacks
- Existing message/tool types such as `BaseMessage`, `AIMessageChunk`, `ToolMessage`, `MessageContent`, and existing tool interfaces

If a constructor does not contextually type `func`, annotate the callback parameter directly in addition to the generic.

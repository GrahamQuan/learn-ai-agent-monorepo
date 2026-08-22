---
name: nestjs-to-honojs
description: Conservatively migrate an existing NestJS TypeScript service to Hono with ordinary PostgreSQL and Drizzle ORM. Use when the user wants a near-1:1 framework migration that preserves files, class and function names, business flow, comments, and the source project's coding style instead of redesigning the application.
---

# NestJS to HonoJS

## Goal

Convert the requested NestJS project to Hono, PostgreSQL, and Drizzle ORM with the smallest necessary changes. Treat this as a mechanical framework and persistence migration, not a refactor or architecture redesign.

## Non-negotiable preservation rules

- Keep the original filenames, class names, exported names, public method names, parameters, return shapes, route paths, status codes, error messages, event names, and execution order whenever the target stack permits it.
- Keep business method bodies as close to line-for-line as possible. Change only NestJS integration, database access, environment access, and types required by those changes.
- Preserve every source comment, including comments in TypeScript, JavaScript, HTML, configuration, tests, and public assets. Keep each comment verbatim next to the corresponding migrated code. If the commented NestJS construct is replaced, move the comment next to its Hono/Drizzle equivalent instead of deleting it.
- Preserve the source project's simple style, including its existing controller/service/module split. Do not introduce repositories, use cases, factories, dependency-injection containers, generic base classes, new DTO layers, or barrel files just because they appear cleaner.
- Do not rename or reorganize unrelated code. Do not add endpoints, health checks, validation behavior, abstractions, or features that were not present in the source.
- If Hono requires adapter code, add the thinnest adapter around the original method instead of folding the method into the route callback.
- Treat the source as read-only and write only to the requested target. Preserve unrelated or pre-existing target changes.

## Workflow

1. Read repository guidance, then inventory the source and target with `rg --files`. Read all source code, configuration, public assets, tests, and comments before editing. Make a comment inventory with `rg` so comments can be checked after migration.
2. Record a source-to-target checklist by relative path. Use the source path and basename by default; deviations require a stack-related reason.
3. Identify externally observable behavior: routes, multipart fields, query and path parameters, response shapes, streaming/SSE behavior, WebSocket paths, static assets, errors, background hooks, events, and database queries.
4. Migrate files mechanically in place. Remove NestJS decorators and imports, then add only the Hono wiring needed to expose the same classes and methods.
5. Replace the existing persistence calls with equivalent Drizzle queries while preserving surrounding service methods and business flow.
6. Centralize all Drizzle table and relation declarations in the schema folder described below.
7. Replace scattered environment reads with the single Zod environment module described below.
8. Copy public assets and all comments exactly. Adapt tests to the new runtime while keeping test filenames, suite names, assertions, and comments close to the source.
9. Install only dependencies required by the migrated implementation. Remove obsolete NestJS or old ORM dependencies only when the target package no longer uses them.
10. Run typecheck, unit tests, e2e tests, and a local startup smoke test when practical. Exercise the original routes, assets, SSE, and WebSocket endpoints that can be tested without paid or production calls.
11. Compare source and target file lists and inspect diffs before finishing. Remove leftover scaffold files only when they clearly belong to the target template and conflict with the requested migration; never delete unknown user artifacts.

## NestJS to Hono mapping

- Keep each `*.controller.ts` and controller class. Add a `routes` Hono instance or an equally thin route-registration method in that class. Route callbacks should parse Hono input, call the original controller method, and serialize its result.
- Keep each `*.service.ts` and service class. Remove `@Injectable()` and constructor injection decorators, but preserve constructor dependency order and service methods.
- Keep each `*.module.ts` and module class. Replace `@Module()` metadata with minimal manual construction/composition. Do not merge modules or services together.
- Replace Nest exception types with Hono `HTTPException` only at the corresponding failure point, retaining status and message.
- Replace Nest interceptors, pipes, guards, filters, SSE, events, lifecycle hooks, static serving, or WebSocket setup with the closest Hono/Node equivalent without changing the public contract.
- Keep `main.ts` and `bootstrap()` when present. Let it construct the app, start the Hono Node server, attach any WebSocket server, and register equivalent shutdown hooks.
- Prefer direct constructor wiring or tiny module containers. Do not add a third-party DI framework unless the source behavior genuinely depends on one and the user requests it.

## PostgreSQL and Drizzle ORM

- Use regular PostgreSQL connectivity, not a Neon-specific adapter. Unless the target already establishes another ordinary PostgreSQL convention, use `pg` with `drizzle-orm/node-postgres`.
- Require `DATABASE_URL` through the environment module. Treat Neon as a remote PostgreSQL database; do not add Neon-only packages or APIs.
- Put every Drizzle schema declaration under exactly one folder, defaulting to `src/db/schema/`. This includes every table, PostgreSQL enum, relation, schema helper, and inferred row type derived directly from tables. Do not leave or duplicate schema declarations in feature, service, module, database-client, or migration source folders.
- When source entities or schemas are scattered, move their Drizzle equivalents into that one folder while retaining their original basenames and exported domain names where practical. This is the intentional exception to preserving the original directory location.
- Keep the database client in one small file such as `src/db/index.ts` or the closest existing database filename. Do not put table declarations in the client file.
- Keep generated SQL migrations in the configured Drizzle migrations directory, separate from `src/db/schema/`.
- Translate queries inside the existing service/repository method that owned them. Preserve filtering, ordering, pagination, transactions, return shapes, and not-found behavior.
- Do not redesign table or column names. Preserve explicit database names, nullability, defaults, indexes, uniqueness, foreign keys, timestamps, and cascade rules from the source schema.
- Add `drizzle.config.ts` only when migration generation or execution is in scope. Point its `schema` setting at the centralized schema folder and use the standard PostgreSQL dialect.

## Zod environment module

- Use one environment file, defaulting to `src/env.ts`, as the only place that reads and validates `process.env`.
- Load `.env` before validation when the runtime needs it. Define one Zod object containing every runtime variable, including a required `DATABASE_URL`.
- Validate synchronously at module startup. If validation fails, print a clear error to stderr showing the missing or invalid variable names, then throw so the process exits non-zero. Missing environment variables must never silently become empty strings or `undefined` dependencies.
- Do not provide defaults for credentials, secrets, or `DATABASE_URL`. Defaults are acceptable only for genuinely optional operational values such as `PORT` or `HOST` when that matches source behavior.
- Export the parsed, typed `env` object and update runtime code to use it instead of scattered `process.env` or config-service calls.
- Provide or update `.env.example` with names and safe placeholders only. Never expose, replace, or print real secret values.

Use this failure shape or the installed Zod version's equivalent; keep the implementation simple:

```ts
const result = EnvSchema.safeParse(process.env);

if (!result.success) {
  console.error('Invalid environment variables:');
  console.error(z.prettifyError(result.error));
  throw new Error('Environment validation failed');
}

export const env = result.data;
```

## Verification and handoff

- Typecheck and test the target package, not the entire monorepo unless necessary.
- Start once with a required environment variable intentionally absent and confirm the terminal output names it and exits non-zero. Then run the normal startup smoke test with safe test values.
- Search the whole target source for Drizzle declarations such as `pgTable`, `pgEnum`, and `relations`; verify every declaration is inside the one centralized schema folder.
- Compare the source and target comment inventories. Every source comment must appear in the target beside the corresponding migrated code or asset; report any unavoidable exception explicitly instead of silently dropping it.
- Verify old NestJS decorators/imports, the old ORM, and Neon-specific adapters are absent from migrated runtime code.
- Report the preserved structure, unavoidable framework-specific differences, verification commands and results, and any credentials or remote integrations the user must supply. Do not claim remote ASR, TTS, LLM, or database operations passed unless they were actually called successfully.

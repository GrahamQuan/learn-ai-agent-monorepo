# Learn AI Agent

A small monorepo for learning how AI agents are built.

The learning roadmap will be added later. This repo currently contains the base Node.js workspace, tooling, and a simple Hono API app to make sure the setup can run, typecheck, and test cleanly. The AI agent learning path will focus on Node.js, LangChain, and LangGraph.

## Stack

- Node.js 24.15.0
- pnpm 10.33.0
- Turborepo
- TypeScript with tsx
- Biome
- Vitest
- Playwright
- Hono
- AI SDK
- LangChain
- LangGraph

## Commands

```bash
nvm use
pnpm install
pnpm dev
pnpm check
pnpm test:e2e
```

This repo enforces the Node.js and pnpm versions declared in `package.json`.
If you switch from another repo and run a pnpm command with the wrong runtime,
pnpm will stop with an engine error instead of continuing with a mismatched
version.

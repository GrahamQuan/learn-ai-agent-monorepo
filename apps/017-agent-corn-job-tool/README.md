# 017 Agent Cron Job Tool

这是把原 NestJS 示例迁移为 Hono + TypeScript 的版本。数据库使用 Drizzle ORM + PostgreSQL，通过标准 `pg` 驱动连接 Neon 或其他远程 PostgreSQL。它保留了原项目的用户 CRUD、AI 工具调用、SSE 聊天、邮件、网页搜索，以及 `cron` / `every` / `at` 三种定时任务。

## 启动

```bash
cp .env.example .env
pnpm install
pnpm --filter 017-agent-corn-job-tool db:migrate
pnpm --filter 017-agent-corn-job-tool dev
```

应用默认监听 `http://127.0.0.1:3000`。把 Neon 提供的 PostgreSQL 连接字符串放到 `DATABASE_URL`，并保留其中的 `sslmode=require` 参数。首次启动前需要执行 Drizzle migration。

## 接口

- `GET /health`：健康检查
- `POST /users`、`GET /users`、`GET/PATCH/DELETE /users/:id`：用户 CRUD
- `GET /ai/chat?query=...`：普通 AI 响应
- `GET /ai/chat/stream?query=...`：SSE AI 响应
- `GET /ai-sse-test.html`：浏览器 SSE 测试页面

## Nest 到 Hono 的对应关系

- Controller 装饰器改为显式的 Hono route handlers。
- 原来的文件名、class 名和业务方法名保持不变，依赖在 `app.module.ts` 中显式组装。
- `@nestjs/schedule` 改为项目内同名的 `SchedulerRegistry`。
- Nest Mailer 改为直接使用 Nodemailer。
- `UsersService` 和 `JobService` 直接使用 Drizzle ORM，未增加 repository 层。
- 连接层使用标准 `pg.Pool`，没有使用 Neon 专用 adapter。
- 所有 table、enum 和数据库推导类型统一放在 `src/database/schema/`，通过 `schema/index.ts` 集中导出。

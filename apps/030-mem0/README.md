# Mem0 记忆示例

用一段对话观察 Agent 的长期记忆如何工作：先告诉它「我是素食主义者，而且对坚果过敏」，再用「用户的饮食限制是什么？」检索提取出的记忆。可以先跑本地 API 示例，再试云端的记忆作用域和 Redis 多轮对话。

## 启动本地 Mem0

在 monorepo 根目录使用 `.nvmrc` 指定的 Node.js 版本，执行 `pnpm install`。然后进入示例目录，后续命令均在这里执行：

```bash
cd apps/030-mem0
test -f .env || cp .env.example .env
```

在 `.env` 中填写自己的 DashScope 密钥，并将模板里的 `OPENAI_BASE_URL` 改为以下地址：

```dotenv
OPENAI_API_KEY=<你的 DashScope API Key>
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

启动 Docker Desktop（或本机 Docker Engine），确认 `docker info` 能显示 Server 信息，再运行：

```bash
pnpm mem0:setup
pnpm mem0:run:docker
```

- **初始化**会将 Mem0 克隆到与 monorepo 同级的 `mem0/`，已有仓库时直接复用。脚本将密钥同步到 `mem0/server/.env`，配置 `qwen-plus` 和固定输出 1536 维的 `text-embedding-v2`，并调整服务端和 Dashboard 的构建配置。首次初始化会补齐数据库密码和 JWT 密钥，重复运行会沿用已有值。更换 DashScope 密钥后，再次执行上面两条命令即可。
- **启动**使用同级仓库的 `mem0/server/docker-compose.yaml` 在后台运行 API、Dashboard 和 PostgreSQL。API 地址为 `http://localhost:8888`，可打开 [Dashboard](http://localhost:3000) 查看服务。此配置面向本地开发，默认关闭 API 认证，`MEM0_LOCAL_API_KEY` 可留空。
- 如果启动时报 `docker.sock: no such file or directory`，先启动 Docker Desktop，等 `docker info` 显示引擎版本后重试 `pnpm mem0:run:docker`。

## 写入、检索和停止

```bash
pnpm local-api         # 给 local_api_demo 写入示例对话
pnpm local-api:list    # 查看该用户已保存的记忆
pnpm local-api:search  # 按语义检索饮食限制
pnpm mem0:stop:docker  # 停止本地 Mem0 服务，保留 PostgreSQL 数据卷
```

再次执行 `pnpm mem0:run:docker` 后，可以用 `pnpm local-api:list` 查看之前的记忆。如果要删除示例用户的数据，在服务运行时执行 `pnpm local-api:cleanup`。

## 云端 Mem0 与 Redis Agent

以下示例使用 Mem0 云端 SDK，需要在本目录的 `.env` 中填写 `MEM0_API_KEY`。

| 示例 | 命令 | 可以观察什么 |
| --- | --- | --- |
| 云端记忆操作 | `pnpm start` | 搜索并列出 `demo-user` 的记忆。有记录时，更新首条记忆并读取变更历史。运行 `pnpm cleanup` 会在演示结束时删除该用户的全部记忆。 |
| 记忆作用域 | `pnpm scoped-memory:add`，稍后执行 `pnpm scoped-memory:search` | 比较按用户、会话和 Agent 检索的结果。云端写入异步处理，实验结束可用 `pnpm scoped-memory:cleanup` 清理示例数据。 |
| 交互式 Agent | `docker compose up -d redis`，然后执行 `pnpm agent` | Redis 保存近期对话，Mem0 保存用户和会话层的长期记忆。还需配置 `OPENAI_API_KEY`、`OPENAI_BASE_URL` 和对应的 `MODEL_NAME`（使用上述 DashScope 配置时可填 `qwen-plus`）。 |

交互式 Agent 中输入 `exit` 退出。本目录的 `docker-compose.yml` 管理 Redis 和 RedisInsight，退出后可在本目录运行 `docker compose down` 停止这组服务。

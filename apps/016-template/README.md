# 016 Hono LangChain

这个示例由 `hello-nest-langchain` 迁移而来，使用 Hono + TypeScript 保留原项目的路由、内存 Book 仓库、LangChain 调用和 SSE 流式输出。

## 运行

先参考 `.env.example` 配置 `.env`，然后在仓库根目录运行：

```bash
pnpm --filter 016-template dev
```

默认服务地址为 `http://127.0.0.1:3000`，SSE 测试页面位于：

```text
http://127.0.0.1:3000/sse-test.html
```

## API

- `GET /`：返回 `Hello World!`
- `GET /health`：健康检查
- `GET /book`：返回内存中的图书列表
- `POST /book`：保留原项目的新增示例响应
- `GET /book/:id`：保留原项目的查询示例响应
- `PATCH /book/:id`：保留原项目的更新示例响应
- `DELETE /book/:id`：保留原项目的删除示例响应
- `GET /ai/chat?query=...`：返回完整的 LangChain 响应
- `GET /ai/chat/stream?query=...`：通过 SSE 流式返回响应

## Nest 到 Hono 的对应关系

- Nest controller 对应 Hono 子路由文件
- Nest provider/service 对应普通 TypeScript class
- Nest module 对应 `app.ts` 中的路由组合
- Nest injection token 对应构造函数参数或工厂函数
- Nest `@Sse()` 对应 Hono 的 `streamSSE()`


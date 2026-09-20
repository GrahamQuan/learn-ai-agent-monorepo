# 023-elastic-search

从课程 `es-test` 迁入，保留原有逻辑，将 7 个 `.mjs` 脚本转换为 TypeScript。
原课程笔记保存在 `es-test.md`、`es-test2.md`、`es-test3.md`。

## 运行

使用仓库要求的 Node.js 24.15.0 和 pnpm 10.33.0。在本目录将 `.env.example`
复制为 `.env` 并填写 API Key，然后在仓库根目录执行：

```sh
pnpm --filter 023-elastic-search docker-compose:up
pnpm --filter 023-elastic-search create
pnpm --filter 023-elastic-search seed
pnpm --filter 023-elastic-search rag
```

- `create`：创建 `travel_journal` 索引并添加示例数据。
- `operate`：Elasticsearch CRUD 示例；当前保留源代码的固定文档 ID 删除操作。
- `seed`：删除并重建 `life_notes` ES 索引及 Milvus 集合，再写入示例数据。
- `rag`：查询扩展 → ES 与 Milvus 并行召回 → 按 ID 去重 → 重排 → 生成回答。
- `rerank`：单独运行重排示例。
- `typecheck`：执行 TypeScript 检查，不连接外部服务。

环境变量统一由 `src/env.ts` 加载并通过 Zod 校验，`OPENAI_API_KEY` 必填。
`rag` 的聊天模型通过 `LLM_MODEL_NAME` 设置；`seed` 与 `rag` 共用
`EMBEDDINGS_MODEL_NAME` 和 `OPENAI_BASE_URL`，确保写入与检索使用相同的嵌入配置。
重排通过 `RERANK_MODEL` 和 `RERANK_URL` 配置。默认值见 `src/env.ts`。

Docker Compose 包含 Elasticsearch、Kibana、Milvus、etcd 和 MinIO；本地数据
写入本目录的 `volumes/`，已加入忽略规则。

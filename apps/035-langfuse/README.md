# Deep Agents + Langfuse（Trace + 评测）

TypeScript demo：Deep Agent 调用 LLM / 工具，Trace 打到 Langfuse；另有一键离线评测（Dataset + Experiment）。

## 快速开始

```bash
# 在仓库根目录执行
pnpm install
cp apps/035-langfuse/.env.example apps/035-langfuse/.env
# 填写 .env 中的 LANGFUSE_* 与 OPENAI_API_KEY
pnpm --filter 035-langfuse demo       # 单次调用 + Trace
pnpm --filter 035-langfuse eval       # Dataset 评测 + Scores
pnpm --filter 035-langfuse typecheck
```

## 结构

```
src/
  env.ts               # dotenv 加载、Zod 校验、统一配置入口
  instrumentation.ts   # OTEL + LangfuseSpanProcessor（最先加载）
  agent.ts             # 工具 + Deep Agent（demo / eval 共用）
  index.ts             # 单次 demo + CallbackHandler
  evaluate.ts          # Dataset → Experiment → Evaluators
```

## Trace（`pnpm --filter 035-langfuse demo`）

跑完后在 Langfuse **Traces** 里看 tag `deepagents`。

## 评测（`pnpm --filter 035-langfuse eval`）

1. 创建/复用 Dataset（默认名 `deepagents-eval`）并 upsert 测试用例
2. `dataset.runExperiment` 对每条用例跑 Agent（带 CallbackHandler）
3. Item 级打分：`keyword_hit`、`non_empty`
4. Run 级汇总：`avg_keyword_hit`
5. 在 Langfuse **Datasets → deepagents-eval → Runs** 查看结果与对比

可用环境变量 `LANGFUSE_DATASET_NAME` 覆盖 Dataset 名称。

`env.ts` 校验必填密钥和可选 URL。未设置模型时沿用 `gpt-4o-mini`，未设置 Dataset 名称时沿用 `deepagents-eval`；示例中的 `qwen-plus` 和兼容端点保持不变。SDK 自动读取的 OpenAI 与 LangChain 环境变量仍由 dotenv 加载。

保留源示例的空分数分支（`value: null`），并用局部 `@ts-expect-error` 标记与 Langfuse `Evaluation` 类型的差异；该分支能否被服务端接受尚未验证。真实 Trace / 评测需要配置密钥并连接 Langfuse 和模型服务。

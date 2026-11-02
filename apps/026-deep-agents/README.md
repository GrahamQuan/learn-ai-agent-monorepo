# 026-deep-agents

从 `deepagents-test` 导入的 TypeScript 学习示例，展示 LangChain `createAgent` 与 deepagents 中间件。

在当前应用目录将 `.env.example` 复制为 `.env`，填写模型服务密钥。环境变量由 `src/env.ts` 统一加载和校验；不使用 LangSmith 时可省略三个 `LANGCHAIN_*` 配置，或将追踪开关设为 `false`。

在仓库根目录运行：

```sh
pnpm --filter 026-deep-agents typecheck
pnpm --filter 026-deep-agents middleware
```

| 脚本 | 示例 |
| --- | --- |
| `middleware` | 日志、上下文注入、请求拦截 |
| `middleware:tools` | 工具注册、包装与调用次数统计 |
| `filesystem` | 文件系统读写权限 |
| `memory` | 项目记忆与用户偏好 |
| `skills` | 加载技能并生成 Excalidraw 图表 |
| `subagent` | 数学解题、辅导讲解、练习题子 Agent |
| `summarization` | 对话摘要与历史文件 |

所有运行示例会调用模型 API。`filesystem` 和 `summarization` 每次会重建各自的示例工作目录；`memory` 会更新随项目提供的记忆文件。

`skills` 还需要在本应用目录安装示例指定的技能：

```sh
npx skills add github/awesome-copilot --skill excalidraw-diagram-generator -y
```

技能输出写入 `src/deepagents/output/`。原项目运行生成的摘要历史未导入。

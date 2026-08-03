import { HumanMessage, SystemMessage, ToolMessage, type BaseMessage } from '@langchain/core/messages';
import type { StructuredToolInterface } from '@langchain/core/tools';
import type { ChatOpenAI } from '@langchain/openai';

export class JobAgentService {
  private readonly modelWithTools: ReturnType<ChatOpenAI['bindTools']>;

  constructor(
    model: ChatOpenAI,
    private readonly sendMailTool: StructuredToolInterface,
    private readonly webSearchTool: StructuredToolInterface,
    private readonly dbUsersCrudTool: StructuredToolInterface,
    private readonly timeNowTool: StructuredToolInterface,
  ) {
    this.modelWithTools = model.bindTools([
      this.sendMailTool,
      this.webSearchTool,
      this.dbUsersCrudTool,
      this.timeNowTool,
    ]);
  }

  async runJob(instruction: string): Promise<string> {
    const messages: BaseMessage[] = [
      new SystemMessage(
        '你是一个用于执行后台任务的智能代理。你会根据给定的任务指令，必要时调用工具（如 db_users_crud、send_mail、web_search、time_now 等）来查询或改写数据，然后给出清晰的步骤和结果说明。',
      ),
      new HumanMessage(instruction),
    ];

    while (true) {
      const aiMessage = await this.modelWithTools.invoke(messages);
      messages.push(aiMessage);
      const toolCalls = aiMessage.tool_calls ?? [];
      if (!toolCalls.length) return String(aiMessage.content ?? '');

      for (const toolCall of toolCalls) {
        const toolCallId = toolCall.id || '';
        const toolName = toolCall.name;
        let result: unknown;

        if (toolName === 'send_mail') result = await this.sendMailTool.invoke(toolCall.args);
        else if (toolName === 'web_search') result = await this.webSearchTool.invoke(toolCall.args);
        else if (toolName === 'db_users_crud') result = await this.dbUsersCrudTool.invoke(toolCall.args);
        else if (toolName === 'time_now') result = await this.timeNowTool.invoke({});
        else result = `未知工具调用: ${toolName}`;

        messages.push(
          new ToolMessage({
            tool_call_id: toolCallId,
            name: toolName,
            content: typeof result === 'string' ? result : JSON.stringify(result),
          }),
        );
      }
    }
  }
}

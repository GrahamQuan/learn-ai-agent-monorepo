import type { StructuredToolInterface } from '@langchain/core/tools';
import type { ChatOpenAI } from '@langchain/openai';

export class ToolModule {
  constructor(
    readonly chatModel: ChatOpenAI,
    readonly sendMailTool: StructuredToolInterface,
    readonly webSearchTool: StructuredToolInterface,
    readonly dbUsersCrudTool: StructuredToolInterface,
    readonly timeNowTool: StructuredToolInterface,
    readonly cronJobTool: StructuredToolInterface,
  ) {}
}

import { tool, type StructuredToolInterface } from '@langchain/core/tools';
import { z } from 'zod';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { UserService } from './user.service';

export function createQueryUserTool(userService: UserService): StructuredToolInterface {
  const queryUserArgsSchema = z.object({
    userId: z.string().describe('用户 ID，例如: 001, 002, 003'),
  });

  return tool(
    async ({ userId }) => {
      const user = userService.findOne(userId);
      if (!user) {
        const availableIds = userService
          .findAll()
          .map((item) => item.id)
          .join(', ');
        return `用户 ID ${userId} 不存在。可用的 ID: ${availableIds}`;
      }
      return `用户信息：\n- ID: ${user.id}\n- 姓名: ${user.name}\n- 邮箱: ${user.email}\n- 角色: ${user.role}`;
    },
    {
      name: 'query_user',
      description: '查询数据库中的用户信息。输入用户 ID，返回该用户的详细信息（姓名、邮箱、角色）。',
      schema: queryUserArgsSchema,
    },
  );
}

export class AiModule {
  constructor(
    readonly aiService: AiService,
    readonly aiController: AiController,
    readonly userService: UserService,
    readonly queryUserTool: StructuredToolInterface,
  ) {}
}

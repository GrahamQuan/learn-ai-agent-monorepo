import { z } from 'zod';
import { model } from './model';
import { tryCatch } from './utils/try-catch';

// 定义结构化输出的 schema
const scientistSchema = z.object({
  name: z.string().describe('科学家的全名'),
  birth_year: z.number().describe('出生年份'),
  nationality: z.string().describe('国籍'),
  fields: z.array(z.string()).describe('研究领域列表'),
});

const modelWithTool = model.bindTools([
  {
    name: 'extract_scientist_info',
    description: '提取和结构化科学家的详细信息',
    schema: scientistSchema,
  },
]);

async function main() {
  // 调用模型
  const [error, response] = await tryCatch(modelWithTool.invoke('介绍一下爱因斯坦'));
  if (error) {
    console.error('错误:', error.message);
    return;
  }

  console.log('response.tool_calls:', response.tool_calls);
  // 获取结构化结果

  const result = response?.tool_calls?.[0]?.args;

  if (!result) {
    console.error('结构化结果为空');
    return;
  }

  console.log('结构化结果:', JSON.stringify(result, null, 2));
  console.log(`\n姓名: ${result.name}`);
  console.log(`出生年份: ${result.birth_year}`);
  console.log(`国籍: ${result.nationality}`);
  console.log(`研究领域: ${result.fields.join(', ')}`);
}

main().catch(console.error);

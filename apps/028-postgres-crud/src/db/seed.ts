import { OpenAIEmbeddings } from '@langchain/openai';
import { env } from '../env';
import { db, pool } from './index';
import { Conversation } from './schema/conversation.entity';
import { Message, MessageRole } from './schema/message.entity';
import { User } from './schema/user.entity';

async function seed() {
  if (!env.OPENAI_API_KEY) throw new Error('生成 seed 消息向量需要 OPENAI_API_KEY');

  const semanticMessages = [
    { role: MessageRole.USER, content: 'PostgreSQL 支持哪些数据类型？' },
    {
      role: MessageRole.ASSISTANT,
      content: 'PostgreSQL 支持整数、文本、JSON、数组，以及 pgvector 扩展提供的向量类型。',
    },
    { role: MessageRole.USER, content: '怎么做相似度搜索？' },
    {
      role: MessageRole.ASSISTANT,
      content: '可以使用 pgvector 的 cosine 距离运算符 <=>，配合 hnsw 索引加速向量检索。',
    },
  ];
  const embeddings = new OpenAIEmbeddings({
    apiKey: env.OPENAI_API_KEY,
    model: env.EMBEDDING_MODEL,
    configuration: { baseURL: env.OPENAI_BASE_URL },
  });
  // 先生成向量，再开启数据库事务。
  const vectors = await embeddings.embedDocuments(semanticMessages.map(({ content }) => content));
  if (vectors.length !== semanticMessages.length || vectors.some((vector) => vector.length !== 1024)) {
    throw new Error('每条语义检索消息需要一个 1024 维向量');
  }

  const ids = await db.transaction(async (tx) => {
    const [user] = await tx.insert(User).values({ name: '李四' }).returning({ id: User.id });
    if (!user) throw new Error('未能创建示例用户');
    const [conversation] = await tx
      .insert(Conversation)
      .values({ userId: user.id, title: '更新后的标题' })
      .returning({ id: Conversation.id });
    if (!conversation) throw new Error('未能创建示例会话');

    const messages = [
      { role: MessageRole.USER, content: '你好，请介绍一下 pgvector' },
      { role: MessageRole.ASSISTANT, content: 'PostgreSQL 是一个功能强大的开源关系型数据库。' },
      ...semanticMessages.map((message, index) => ({ ...message, embedding: vectors[index]! })),
    ];
    // 查询接口按 createdAt 排序；同一事务的默认 now() 相同。
    const start = Date.now();
    await tx.insert(Message).values(
      messages.map((message, i) => ({
        ...message,
        conversationId: conversation.id,
        createdAt: new Date(start + i),
      })),
    );
    return { userId: user.id, conversationId: conversation.id };
  });
  console.log('示例数据已写入：', ids);
}

seed()
  .catch((error: unknown) => {
    console.error('Seed 失败：', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(() => pool.end());

import { OpenAIEmbeddings } from '@langchain/openai';
import { eq, sql } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import type { db } from '../db';
import { Conversation } from '../db/schema/conversation.entity';
import { User } from '../db/schema/user.entity';
import { env } from '../env';

export type SemanticSearchResult = {
  id: number;
  conversation_id: number;
  role: string;
  content: string;
  created_at: Date;
  similarity: number;
};

export class ConversationsService {
  private embeddings: OpenAIEmbeddings | null = null;

  constructor(private readonly em: typeof db) {}

  /** 用户 → 会话（一对多） */
  async findConversationsByUserId(userId: number) {
    const user = await this.em.query.User.findFirst({
      where: eq(User.id, userId),
      with: {
        conversations: {
          orderBy: (conversation, { desc }) => [desc(conversation.createdAt)],
        },
      },
    });

    if (!user) {
      throw new HTTPException(404, { message: `User #${userId} not found` });
    }

    return user;
  }

  /** 会话 → 消息（一对多） */
  async findMessagesByConversationId(conversationId: number) {
    const conversation = await this.em.query.Conversation.findFirst({
      where: eq(Conversation.id, conversationId),
      with: {
        messages: { orderBy: (message, { asc }) => [asc(message.createdAt)] },
      },
    });

    if (!conversation) {
      throw new HTTPException(404, {
        message: `Conversation #${conversationId} not found`,
      });
    }

    return {
      id: conversation.id,
      userId: conversation.userId,
      title: conversation.title,
      createdAt: conversation.createdAt,
      messages: conversation.messages.map(({ id, conversationId, role, content, createdAt }) => ({
        id,
        conversationId,
        role,
        content,
        createdAt,
      })),
    };
  }

  /** 会话内语义检索（pgvector 余弦距离） */
  async searchSimilarMessages(conversationId: number, searchText: string, limit = 5): Promise<SemanticSearchResult[]> {
    const conversation = await this.em.query.Conversation.findFirst({
      where: eq(Conversation.id, conversationId),
    });

    if (!conversation) {
      throw new HTTPException(404, {
        message: `Conversation #${conversationId} not found`,
      });
    }

    const vector = await this.embedQuery(searchText);

    const { rows } = await this.em.execute<SemanticSearchResult>(sql`
       SELECT id, conversation_id, role, content, created_at,
              1 - (embedding <=> ${JSON.stringify(vector)}::vector) AS similarity
       FROM messages
       WHERE conversation_id = ${conversationId} AND embedding IS NOT NULL
       ORDER BY embedding <=> ${JSON.stringify(vector)}::vector
       LIMIT ${limit}`);

    return rows.map((row) => ({
      ...row,
      similarity: Number(row.similarity),
    }));
  }

  private getEmbeddings(): OpenAIEmbeddings {
    if (!this.embeddings) {
      if (!env.OPENAI_API_KEY) {
        throw new HTTPException(400, {
          message: '语义检索需要配置 OPENAI_API_KEY（与 pgsql-test 相同）',
        });
      }
      this.embeddings = new OpenAIEmbeddings({
        model: env.EMBEDDING_MODEL,
        apiKey: env.OPENAI_API_KEY,
        configuration: {
          baseURL: env.OPENAI_BASE_URL,
        },
      });
    }
    return this.embeddings;
  }

  private async embedQuery(text: string): Promise<number[]> {
    return this.getEmbeddings().embedQuery(text);
  }
}

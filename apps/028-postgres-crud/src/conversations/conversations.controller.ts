import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ConversationsService } from './conversations.service';
import type { SemanticSearchDto } from './dto/semantic-search.dto';

export class ConversationsController {
  readonly routes = new Hono();

  constructor(private readonly conversationsService: ConversationsService) {
    this.routes.get('/users/:userId', async (c) => c.json(await this.findByUser(this.parseInt(c.req.param('userId')))));
    this.routes.get('/:id/messages', async (c) => c.json(await this.findMessages(this.parseInt(c.req.param('id')))));
    this.routes.post('/:id/search', async (c) => {
      const id = this.parseInt(c.req.param('id'));
      let dto: SemanticSearchDto;
      try {
        dto = await c.req.json<SemanticSearchDto>();
      } catch {
        throw new HTTPException(400, { message: 'Invalid JSON body' });
      }
      const queryLimit = this.parseInt(c.req.query('limit') ?? '5');
      return c.json(await this.search(id, dto, queryLimit), 201);
    });
  }

  private parseInt(value: string): number {
    if (!/^-?\d+$/.test(value) || !Number.isFinite(Number(value))) {
      throw new HTTPException(400, {
        message: 'Validation failed (numeric string is expected)',
      });
    }
    return Number.parseInt(value, 10);
  }

  /** GET /conversations/users/:userId — 用户的会话列表 */
  findByUser(userId: number) {
    return this.conversationsService.findConversationsByUserId(userId);
  }

  /** GET /conversations/:id/messages — 会话的消息列表 */
  findMessages(id: number) {
    return this.conversationsService.findMessagesByConversationId(id);
  }

  /** POST /conversations/:id/search — 会话内语义检索 */
  search(id: number, dto: SemanticSearchDto, queryLimit?: number) {
    const limit = dto.limit ?? queryLimit ?? 5;
    return this.conversationsService.searchSimilarMessages(id, dto.query, limit);
  }
}

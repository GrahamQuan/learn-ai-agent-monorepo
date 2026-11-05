import { integer, pgTable, serial, text, timestamp, vector } from 'drizzle-orm/pg-core';
import { Conversation } from './conversation.entity';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export const Message = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id')
    .notNull()
    .references(() => Conversation.id, { onDelete: 'cascade' }),
  role: text('role').$type<MessageRole>().notNull(),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1024 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

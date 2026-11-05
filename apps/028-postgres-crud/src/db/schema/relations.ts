import { relations } from 'drizzle-orm';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';
import { User } from './user.entity';

export const userRelations = relations(User, ({ many }) => ({
  conversations: many(Conversation),
}));
export const conversationRelations = relations(Conversation, ({ one, many }) => ({
  user: one(User, { fields: [Conversation.userId], references: [User.id] }),
  messages: many(Message),
}));
export const messageRelations = relations(Message, ({ one }) => ({
  conversation: one(Conversation, {
    fields: [Message.conversationId],
    references: [Conversation.id],
  }),
}));

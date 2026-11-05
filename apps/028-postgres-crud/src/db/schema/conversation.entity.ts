import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { User } from './user.entity';

export const Conversation = pgTable('conversations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => User.id, { onDelete: 'cascade' }),
  title: text('title'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

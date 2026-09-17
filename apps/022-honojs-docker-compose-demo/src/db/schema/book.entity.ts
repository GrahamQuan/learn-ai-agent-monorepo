import {
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const books = pgTable('books', {
  id: serial().primaryKey(),
  title: varchar({ length: 255 }).notNull(),
  author: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  price: numeric({ precision: 10, scale: 2, mode: 'number' }).notNull(),
  stock: integer().default(0).notNull(),
  publishedAt: timestamp('published_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type Book = typeof books.$inferSelect;

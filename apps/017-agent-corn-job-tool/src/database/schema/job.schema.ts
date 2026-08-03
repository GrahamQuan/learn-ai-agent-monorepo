import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export type JobType = 'cron' | 'every' | 'at';

export const jobTypeEnum = pgEnum('job_type', ['cron', 'every', 'at']);

export const jobs = pgTable('jobs', {
  id: uuid().defaultRandom().primaryKey(),
  instruction: text().notNull(),
  type: jobTypeEnum().default('cron').notNull(),

  // cron 类型使用（Cron 表达式）
  cron: varchar({ length: 100 }),

  // every 类型使用（间隔毫秒）
  everyMs: integer('every_ms'),

  // at 类型使用（指定触发时间点）
  at: timestamp({ withTimezone: true }),
  isEnabled: boolean('is_enabled').default(true).notNull(),
  lastRun: timestamp('last_run', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;

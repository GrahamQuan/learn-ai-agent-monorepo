import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../env';
import { Conversation } from './schema/conversation.entity';
import { Message } from './schema/message.entity';
import * as relations from './schema/relations';
import { User } from './schema/user.entity';

export const pool = new Pool({ connectionString: env.DATABASE_URL });
export const db = drizzle(pool, {
  schema: { User, Conversation, Message, ...relations },
  logger: true,
});

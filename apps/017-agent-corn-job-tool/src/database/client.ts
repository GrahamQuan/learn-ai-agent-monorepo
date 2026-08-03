import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../env';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;

export const pool = new Pool({ connectionString: env.DATABASE_URL });
export const db: Database = drizzle(pool, { schema });

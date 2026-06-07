import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://jambo:jambo@127.0.0.1:5432/amategeko',
});

export const db = drizzle(pool, { schema });

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// HTTP driver: no WebSocket dependency, reliable on Vercel serverless.
// Safe here because the app uses no DB transactions.
const sql = neon(process.env.DATABASE_URL || 'postgresql://jambo:jambo@127.0.0.1:5432/amategeko');

export const db = drizzle(sql, { schema });

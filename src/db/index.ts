import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import * as schema from './schema';

neonConfig.webSocketConstructor = typeof WebSocket !== 'undefined' ? WebSocket : undefined;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://jambo:jambo@127.0.0.1:5432/amategeko',
});

export const db = drizzle(pool, { schema });

import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const url = process.env.DATABASE_URL || 'postgresql://jambo:jambo@127.0.0.1:5432/amategeko';

// Canonical db type (Neon HTTP driver, used in production on Vercel serverless).
const httpDb = () => drizzleHttp(neon(url), { schema });
export type DB = ReturnType<typeof httpDb>;

// Production (Vercel) uses the HTTP driver — no WebSocket, reliable serverless.
// Locally the Neon HTTP endpoint is frequently unreachable, so dev uses a
// standard TCP `pg` pool (same database, just a reachable transport). Set
// DB_FORCE_TCP=1 to force the TCP driver anywhere.
function createDb(): DB {
  const useTcp = process.env.NODE_ENV !== 'production' || process.env.DB_FORCE_TCP === '1';
  if (!useTcp) return httpDb();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool } = require('pg');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle: drizzlePg } = require('drizzle-orm/node-postgres');
  // Localhost Postgres has no SSL; a remote (e.g. Neon over TCP) needs SSL but
  // node-postgres treats sslmode=require as strict verify-full and chokes on
  // channel_binding, so drop those and don't hard-verify. Only the dev/local
  // transport — production stays on neon-http.
  let connectionString = url;
  let ssl: false | { rejectUnauthorized: boolean } = false;
  try {
    const u = new URL(url);
    const isLocal = ['localhost', '127.0.0.1', '::1'].includes(u.hostname);
    if (!isLocal) {
      u.searchParams.delete('sslmode');
      u.searchParams.delete('channel_binding');
      ssl = { rejectUnauthorized: false };
    }
    connectionString = u.toString();
  } catch {
    /* keep original */
  }
  const pool = new Pool({ connectionString, ssl });
  return drizzlePg(pool, { schema }) as unknown as DB;
}

export const db = createDb();

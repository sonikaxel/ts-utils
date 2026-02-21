import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schemas';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

export const db = drizzle({
  client: pool,
  schema,
});

export type DB = typeof db;

export const tables = schema;

// connect database
pool
  .connect()
  .then((_) => console.log('[DB]: Connected'))
  .catch((e) => console.error('[DB]: Connection fail', e));

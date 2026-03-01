import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { pgClientAgent } from '~~/features/node-postgres';
import * as schema from './schemas';

export const dbClient = new Client({
  connectionString: process.env.DATABASE_URL!,
});

export const db = drizzle({
  client: dbClient,
  schema,
});

export type DB = typeof db;

const CHANNELS = ['test_channel', 'test_channel_2'] as const;

export const dbAgent = pgClientAgent(dbClient, {
  channels: [...CHANNELS],
});

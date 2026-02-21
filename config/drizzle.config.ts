import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  throw new Error('env DATABASE_URL is missing');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/drizzle/schemas.ts',
  out: './lib/drizzle/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});

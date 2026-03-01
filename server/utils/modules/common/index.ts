import { eq } from 'drizzle-orm';
import { H3Event } from 'h3';
import * as z from 'zod/v4';
import {
  SlidingWindowLimit,
  slidingWindowLogLimiter,
} from '~~/features/rate-limiting/sliding-window-log';
import { db } from '~~/lib/drizzle/db';
import { kvStoreTable } from '~~/lib/drizzle/schemas';
import { IStorage } from '~~/types';

export type ModuleReturn<T> = {
  handler: (event: H3Event) => Promise<T>;
  middlewares: (event: H3Event) => Promise<void> | void;
};

const limitSchema = z.object({
  key: z.string().min(1),
  value: z.array(z.number()),
});

// linked to pg database
const kvStorage = {
  get: async (key) => {
    try {
      const data = await db.query.kvStoreTable.findFirst({
        where: (f, { eq }) => eq(f.key, key),
      });
      const parsed = limitSchema.parse(data);
      return parsed.value;
    } catch {
      return undefined;
    }
  },
  set: async (key, value) => {
    try {
      const exists = await db.query.kvStoreTable.findFirst({
        where: (f, { eq }) => eq(f.key, key),
      });

      if (!exists) {
        await db.insert(kvStoreTable).values({ key, value });
        return;
      }

      await db
        .update(kvStoreTable)
        .set({
          value,
        })
        .where(eq(kvStoreTable.key, key));
    } catch {}
  },
  remove: async (key) => {
    try {
      await db.delete(kvStoreTable).where(eq(kvStoreTable.key, key));
    } catch {}
  },
  keys: async () => {
    const keys = await db
      .select({
        key: kvStoreTable.key,
      })
      .from(kvStoreTable);

    return keys.map((k) => k.key);
  },
  has: async (key) => {
    const exists = await db.query.kvStoreTable.findFirst({
      where: (f, { eq }) => eq(f.key, key),
    });

    return exists != null;
  },
} satisfies IStorage<SlidingWindowLimit>;

export const createRateLimitMiddleware = (
  name: string,
  opts: { max: number; window: number },
) => {
  return async (event: H3Event) => {
    const limiter = slidingWindowLogLimiter(name, {
      ...opts,
      storage: kvStorage,
    });
    await limiter.init(event);
  };
};

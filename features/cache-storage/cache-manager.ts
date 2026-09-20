import { Pool } from 'pg';

// Use your existing connection pool or client or pass yours
// Always use this for first initialization purpose
// after initialization, use your main db pool or client or ORM instance
const pgPoolOrClient = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

type CacheResult = {
  value: string | undefined | null;
};

export class CacheManager {
  /**
   * Set a value in the unlogged cache table.
   * @param {string} key - Unique lookup key
   * @param {any} value - Data to store (objects/arrays automatically converted to JSON)
   * @param {number} ttlSeconds - Time-to-live in seconds
   */
  static async set(key: string, value: unknown, ttlSeconds?: number) {
    const stringifiedValue =
      typeof value === 'object' ? JSON.stringify(value) : String(value);

    const values = ['$1', '$2'];
    const params: unknown[] = [key, stringifiedValue];

    if (ttlSeconds != null) {
      values.push(`NOW() + ($3 * INTERVAL '1 second')`);
      params.push(ttlSeconds);
    }

    const query = `
      INSERT INTO app_cache ("key", "value", expires_at) 
      VALUES (
        ${values.join(', ')}
      ) 
      ON CONFLICT (key)
      DO UPDATE SET 
        "value" = EXCLUDED.value, 
        expires_at = EXCLUDED.expires_at,
        created_at = NOW();
      `;

    try {
      await pgPoolOrClient.query(query, [...params]);
      return true;
    } catch (error) {
      console.error(`Cache SET error for key "${key}":`, error);
      // Fail silently so application doesn't crash on cache failure
      return false;
    }
  }

  /**
   * Get a live value from the cache. Returns null on a miss or expiration.
   * @param {string} key
   */
  static async get(key: string): Promise<string | null> {
    const query = `
      SELECT c.value 
      FROM app_cache c
      WHERE c.key = $1 
        AND c.expires_at > NOW();
    `;

    try {
      const res = await pgPoolOrClient.query<CacheResult>(query, [key]);

      if (res.rows.length === 0) return null;

      const rawValue = res.rows[0]?.value || null;

      return rawValue;
    } catch (error) {
      console.error(`Cache GET error for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Explicitly delete a cache key
   * @param {string} key
   */
  static async delete(key: string) {
    try {
      await pgPoolOrClient.query(
        `
        DELETE FROM app_cache WHERE "key" = $1;  
      `,
        [key],
      );
      return true;
    } catch (error) {
      console.error(`Cache DELETE error for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Background task runner to prune expired keys (Application-level cron)
   */
  static async pruneExpired() {
    try {
      const res = await pgPoolOrClient.query(
        'DELETE FROM app_cache WHERE expires_at < NOW();',
      );
      console.log(`[Cache Cleanup] Pruned ${res.rowCount} expired items.`);
    } catch (error) {
      console.error('[Cache Cleanup] Failed to prune expired items:', error);
    }
  }

  /** Increment the value if stored as a integer */
  static async increment(key: string, ttl: number): Promise<number> {
    try {
      if (!Number.isInteger(ttl) || ttl <= 0) {
        throw new TypeError(
          'Increment TTL must be a positive integer in seconds',
        );
      }

      const query = `
        INSERT INTO app_cache ("key", "value", expires_at)
        VALUES ($1, '1', NOW() + ($2 * INTERVAL '1 second'))
        ON CONFLICT (key) 
        DO UPDATE SET 
            value = CASE 
                WHEN app_cache.expires_at <= NOW() THEN '1'
                ELSE (app_cache.value::integer + 1)::text
            END,
            expires_at = CASE 
                WHEN app_cache.expires_at <= NOW() THEN NOW() + ($2 * INTERVAL '1 seconds')::interval
                ELSE app_cache.expires_at
            END
        RETURNING value;
    `;

      const result = await pgPoolOrClient.query<CacheResult>(query, [key, ttl]);

      const value = result.rows[0]?.value;

      if (value == null) {
        throw new Error('Returning value is not a valid integer');
      }

      // Return the fresh counter integer back to Better Auth
      return parseInt(value, 10);
    } catch (e) {
      console.error(`Cache INCREMENT error for key "${key}":`, e);
      return 1;
    }
  }

  /**
   * Initalize Table for first use.
   * This will create a required table for cache to work
   * */
  static async _init() {
    await initialTable();
  }
}

/**
 * Initalize Table for first use.
 * This will create a required table for cache to work
 * */
async function initialTable() {
  try {
    await pgPoolOrClient.query(`
      CREATE UNLOGGED TABLE IF NOT EXISTS app_cache (
        "key" VARCHAR(255) PRIMARY KEY,
        "value" TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ
      );

      CREATE INDEX IF NOT EXISTS idx_cache_expires_at 
      ON app_cache (expires_at);
    `);

    console.log(`Table initalization completed`);
  } catch (e) {
    console.error('Table initalization fail. Error:', e);
  }
}

// Run at once for initializing pg table
// initialTable();

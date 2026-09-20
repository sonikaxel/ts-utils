-- Create an unlogged table for cache
CREATE UNLOGGED TABLE IF NOT EXISTS app_cache (
    "key" VARCHAR(255) PRIMARY KEY,
    "value" TEXT NOT NULL, -- or JSONB
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Crucial: Index the expiration column so the cleanup process is lightning fast
CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON app_cache (expires_at);


--> Insert Statement
INSERT INTO app_cache ("key", "value", expires_at) 
VALUES (
  'test_key',
  '1',
  NOW() + (60 * INTERVAL '1 second')
) 
ON CONFLICT (key)
DO UPDATE SET 
  "value" = EXCLUDED.value, 
  expires_at = EXCLUDED.expires_at,
  created_at = NOW();

-- > Increament value if stored as a integer
INSERT INTO app_cache ("key", "value", expires_at)
  VALUES ('test_key', '1', NOW() + (60 * INTERVAL '1 second'))
  ON CONFLICT (key) 
  DO UPDATE SET 
    -- If expired, reset to 1 and update TTL. Otherwise, increment counter.
    value = CASE 
        WHEN app_cache.expires_at <= NOW() THEN '1'
        ELSE (app_cache.value::integer + 1)::text
    END,
    -- If expired, set new TTL. Otherwise, preserve original expiration timestamp.
    expires_at = CASE 
        WHEN app_cache.expires_at <= NOW() THEN NOW() + (60 * INTERVAL '1 seconds')::interval
        ELSE app_cache.expires_at
    END
RETURNING *;

--> Select Statement
SELECT * 
FROM app_cache c
WHERE c.key = 'test_key' 
  AND c.expires_at > NOW(); -- Automatically ignores stale data


--> Delete expired cache (app level cron job required)
DELETE FROM app_cache WHERE expires_at < NOW();


--> Delete cache table
-- DROP TABLE IF EXISTS app_cache CASCADE;
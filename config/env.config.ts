const REQUIRED_KEYS = ['DATABASE_URL'] as const;

export function checkEnv(env: NodeJS.ProcessEnv) {
  const missing = REQUIRED_KEYS.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }
}

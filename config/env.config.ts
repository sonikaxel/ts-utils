export function checkEnv(env: NodeJS.ProcessEnv) {
  const required = ['DATABASE_URL'];

  const missing = required.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }
}

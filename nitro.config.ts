import { defineNitroConfig } from 'nitropack/config';
import { fileURLToPath } from 'node:url';
import { checkEnv } from './config/env.config';

checkEnv(process.env);

// https://nitro.build/config
export default defineNitroConfig({
  compatibilityDate: 'latest',
  srcDir: 'server',
  imports: false,
  storage: {
    memory: {
      driver: 'memory',
    },
  },
  alias: {
    '~~utils': fileURLToPath(new URL('./utils', import.meta.url)),
  },
});

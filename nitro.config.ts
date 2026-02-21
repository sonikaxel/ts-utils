import { defineNitroConfig } from 'nitropack/config';
import { checkEnv } from '~~/config/env.config';

checkEnv(process.env);

// https://nitro.build/config
export default defineNitroConfig({
  compatibilityDate: 'latest',
  srcDir: 'server',
  imports: false,
});

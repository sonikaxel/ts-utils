import { defineNitroPlugin } from 'nitropack/runtime';
import { dbAgent } from '~~/lib/drizzle/db';

export default defineNitroPlugin(async (nitro) => {
  await dbAgent.connect();

  await dbAgent.attachListenerAll();

  dbAgent.pgClient.on('notification', ({ channel, payload }) => {
    console.log('Notification Received: ', channel, payload);
  });
});

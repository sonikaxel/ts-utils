import { defineEventHandler, readBody } from 'h3';
import { dbAgent } from '~~/lib/drizzle/db';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  await dbAgent.notifyListener('test_channel', {
    name: 'notification',
    type: 'push',
    body,
  });

  return {
    success: true,
  };
});

import { defineEventHandler } from 'h3';
import { slidingWindowLogLimiter } from '~~/features/rate-limiting';

export default defineEventHandler(async (event) => {
  const { init } = slidingWindowLogLimiter({
    window: 60 * 1000,
    max: 50,
  });

  await init(event);
});

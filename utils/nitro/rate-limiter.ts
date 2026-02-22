import { H3Event } from 'h3';
import { useStorage } from 'nitropack/runtime'; // auto-imported in nuxt
import { baseAPIError, getRequestIPAddress } from '.';

type RateLimit = {
  count: number;
  startTime: number;
};

/** Rate limit storage */
const rateLimitersStorage = useStorage<RateLimit>('memory:rateLimiters');

/**
 * Rate limiting using fixed window algo.
 * @param
 * `opts.window` - Window size in ms, default 60,000 (1min)
 * @param
 * `opts.max` - Max request allowed in given Window, default 50
 */
export function fixedWindowRateLimiter(opts?: {
  window?: number;
  max?: number;
}) {
  /** Window size in ms */
  let window: number = opts?.window ?? 60 * 1000;
  /** Max request allowed */
  let max: number = opts?.max ?? 50;

  /**
   * Initialize Rate Limiter
   * @param `H3Event`
   */
  async function init(event: H3Event) {
    const ip = getRequestIPAddress(event);

    // ip not found, cannot rate limit without ip
    if (!ip) return;

    const now = Date.now(); // current timestamp
    let current = await rateLimitersStorage.get(ip); // current data

    /** Reset rate limit count */
    async function resetCount(ip: string) {
      await rateLimitersStorage.set(ip, {
        count: 1,
        startTime: now,
      });
    }

    /** Increment rate limit count */
    async function incrementCount(current: RateLimit, ip: string) {
      current.count++;
      await rateLimitersStorage.set(ip, current);
    }

    // no current data, initialize new data
    if (!current) {
      return resetCount(ip);
    }

    // time difference since first hit
    const timePassed = now - current.startTime;

    // time passed is more than window size, reset count
    if (timePassed > window) {
      return resetCount(ip);
    }

    // count is more than max allowed request, throw error
    if (current.count > max) {
      throw baseAPIError('TOO_MANY_REQUESTS', {
        message: 'Too many requests. Please try again later.',
      });
    }

    // increment count
    return incrementCount(current, ip);
  }

  return {
    /** Initialize Rate Limiter */
    init,
  };
}

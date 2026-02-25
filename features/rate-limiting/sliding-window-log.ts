import { H3Event } from 'h3';
import { baseAPIError, getRequestIPAddress } from '~~/utils';
import { SlidingWindowLimitersStorage } from '.';

/**
 * Rate limiting using sliding window log algorithm.
 * @param
 * `opts.window` - Window size in ms, default 60,000 (1min)
 * @param
 * `opts.max` - Max request allowed in given Window, default 50
 */
export function slidingWindowLogLimiter(opts?: {
  window?: number;
  max?: number;
}) {
  /** Window size in ms */
  let window: number = opts?.window ?? 60 * 1000;
  /** Max request allowed */
  let max: number = opts?.max ?? 50;

  async function isAllowed(ip: string) {
    const now = Date.now();
    const windowStart = now - window;

    // Get or initialize request log for the identifier
    let requests = (await SlidingWindowLimitersStorage.get(ip)) || [];

    // Remove requests that fall outside the time window
    requests = requests.filter((ts) => ts > windowStart);

    // Check if the current request count exceeds the limit
    if (requests.length >= max) {
      await SlidingWindowLimitersStorage.set(ip, requests);
      return false; // Rate limit exceeded
    }

    // Add the new request timestamp and allow the request
    requests.push(now);
    await SlidingWindowLimitersStorage.set(ip, requests);
    return true; // Request allowed
  }

  async function cleanup() {
    const now = Date.now();
    const windowStart = now - window;
    const ips = await SlidingWindowLimitersStorage.keys();

    for (const ip of ips) {
      const requests = await SlidingWindowLimitersStorage.get(ip);

      if (requests == null) continue;

      const valid = requests.filter((ts) => ts > windowStart);

      if (valid.length === 0) {
        await SlidingWindowLimitersStorage.remove(ip);
      } else {
        await SlidingWindowLimitersStorage.set(ip, valid);
      }
    }
  }

  async function init(event: H3Event) {
    const ip = getRequestIPAddress(event);

    // ip not found, cannot rate limit without ip
    if (!ip) return;

    if (await isAllowed(ip)) {
      cleanup();
      return;
    }

    throw baseAPIError('TOO_MANY_REQUESTS', {
      message: 'Too many requests. Please try again later.',
    });
  }

  return {
    /** Initialize Rate Limiter */
    init,
    cleanup,
  };
}

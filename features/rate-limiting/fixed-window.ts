import { H3Event } from 'h3';
import { baseAPIError, getRequestIPAddress } from '~~utils';
import { FixedWindowLimitersStorage, type FixedWindowLimit } from '.';

/**
 * Rate limiting using fixed window algorithm.
 * @param
 * `opts.window` - Window size in ms, default 60,000 (1min)
 * @param
 * `opts.max` - Max request allowed in given Window, default 50
 */
export function fixedWindowLimiter(opts?: { window?: number; max?: number }) {
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
    let current = await FixedWindowLimitersStorage.get(ip); // current data

    // no current data, initialize new data
    if (!current) {
      await resetCount(ip, now);
      return;
    }

    // time difference since first hit
    const timePassed = now - current.startTime;

    // time passed is more than window size, entry may be removed
    if (timePassed > window) {
      await resetCount(ip, now);
      return;
    }

    // count is less than max allowed request, increment count
    if (current.count < max) {
      // increment count
      await incrementCount(current, ip);
      return;
    }

    throw baseAPIError('TOO_MANY_REQUESTS', {
      message: 'Too many requests. Please try again later.',
    });
  }

  /** Reset rate limit count */
  async function resetCount(ip: string, now: number) {
    await FixedWindowLimitersStorage.set(ip, {
      count: 1,
      startTime: now,
      endTime: now + window,
    });
  }

  /** Increment rate limit count */
  async function incrementCount(current: FixedWindowLimit, ip: string) {
    current.count++;
    await FixedWindowLimitersStorage.set(ip, current);
  }

  async function cleanup() {
    const ips = await FixedWindowLimitersStorage.keys();

    for (const ip of ips) {
      const current = await FixedWindowLimitersStorage.get(ip);
      const now = Date.now();

      if (!current) continue;

      if (now > current.endTime) {
        await FixedWindowLimitersStorage.remove(ip);
      }
    }
  }

  return {
    /** Initialize Rate Limiter */
    init,
    cleanup,
  };
}

import { H3Event } from 'h3';
import { baseAPIError, getRequestIPAddress } from '~~utils';
import { createLimiterIndentity } from '.';
import { IStorage } from '~~/types';

const fwStorage = new Map<string, FixedWindowLimit>();

export type FixedWindowLimit = {
  count: number;
  startTime: number;
  endTime: number;
};

/** Fixed Window Rate limit storage */
export const FixedWindowLimitersStorage: IStorage<FixedWindowLimit> = {
  get: async (key) => {
    return fwStorage.get(`${key}`);
  },
  set: async (key, value) => {
    fwStorage.set(`${key}`, value);
    return;
  },
  remove: async (key) => {
    fwStorage.delete(`${key}`);
    return;
  },
  keys: async () => {
    return [...fwStorage.keys()];
  },
  has: async (key) => {
    return fwStorage.has(key);
  },
};

/**
 * Rate limiting using fixed window algorithm.
 * @param
 * `opts.window` - Window size in sec, default 60 (1min)
 * @param
 * `opts.max` - Max request allowed in given Window, default 50
 */
export function fixedWindowLimiter(
  name: string,
  opts?: { window?: number; max?: number },
) {
  /** Window size in ms */
  let window: number = opts?.window ? opts.window * 1e3 : 60 * 1e3;
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

    // identifier
    const identifier = createLimiterIndentity(ip, name);

    const now = Date.now(); // current timestamp
    let current = await FixedWindowLimitersStorage.get(identifier); // current data

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
    // identifier
    const identifier = createLimiterIndentity(ip, name);

    await FixedWindowLimitersStorage.set(identifier, {
      count: 1,
      startTime: now,
      endTime: now + window,
    });
  }

  /** Increment rate limit count */
  async function incrementCount(current: FixedWindowLimit, ip: string) {
    // identifier
    const identifier = createLimiterIndentity(ip, name);

    current.count++;
    await FixedWindowLimitersStorage.set(identifier, current);
  }

  async function cleanup() {
    const ips = await FixedWindowLimitersStorage.keys();

    for (const ip of ips) {
      // identifier
      const identifier = createLimiterIndentity(ip, name);

      const current = await FixedWindowLimitersStorage.get(identifier);
      const now = Date.now();

      if (!current) continue;

      if (now > current.endTime) {
        await FixedWindowLimitersStorage.remove(identifier);
      }
    }
  }

  return {
    /** Initialize Rate Limiter */
    init,
    cleanup,
  };
}

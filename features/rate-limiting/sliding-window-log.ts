import { H3Event, setHeader } from 'h3';
import { baseAPIError, getRequestIPAddress } from '~~utils';
import { createLimiterIndentity } from '.';
import { IStorage } from '~~/types';

const swStorage = new Map<string, SlidingWindowLimit>();

export type SlidingWindowLimit = number[];

export const kvStorage: IStorage<SlidingWindowLimit> = {
  get: async (key) => {
    return swStorage.get(`${key}`);
  },
  set: async (key, value) => {
    swStorage.set(`${key}`, value);
  },
  remove: async (key) => {
    swStorage.delete(`${key}`);
  },
  keys: async () => {
    return [...swStorage.keys()];
  },
  has: async (key) => {
    return swStorage.has(key);
  },
};

export type SlidingWindowLimitersStorage = IStorage<SlidingWindowLimit>;

/**
 * Rate limiting using sliding window log algorithm.
 * @param
 * `opts.window` - Window size in sec, default 60 (1min)
 * @param
 * `opts.max` - Max request allowed in given Window, default 50
 */
export function slidingWindowLogLimiter(
  name: string,
  opts?: {
    window?: number;
    max?: number;
    storage?: SlidingWindowLimitersStorage;
  },
) {
  /** Window size in ms */
  let window: number = opts?.window ? opts.window * 1e3 : 60 * 1e3;
  /** Max request allowed */
  let max: number = opts?.max ?? 50;
  const storage = opts?.storage || kvStorage;
  let remaining = max;

  async function isAllowed(ip: string) {
    const now = Date.now();
    const windowStart = now - window;

    // identifier
    const identifier = createLimiterIndentity(ip, name);

    // Get or initialize request log for the identifier
    let requests = (await storage.get(identifier)) || [];

    // Remove requests that fall outside the time window
    requests = requests.filter((ts) => ts > windowStart);

    remaining = max - requests.length - 1;

    // Check if the current request count exceeds the limit
    if (requests.length >= max) {
      await storage.set(identifier, requests);
      return false; // Rate limit exceeded
    }

    // Add the new request timestamp and allow the request
    requests.push(now);
    await storage.set(identifier, requests);
    return true; // Request allowed
  }

  async function cleanup() {
    const now = Date.now();
    const windowStart = now - window;
    const ips = await storage.keys();

    for (const ip of ips) {
      // identifier
      const identifier = createLimiterIndentity(ip, name);

      const requests = await storage.get(identifier);

      if (requests == null) continue;

      const valid = requests.filter((ts) => ts > windowStart);

      if (valid.length === 0) {
        await storage.remove(identifier);
      } else {
        await storage.set(identifier, valid);
      }
    }
  }

  async function init(event: H3Event) {
    const ip = getRequestIPAddress(event);

    // ip not found, cannot rate limit without ip
    if (!ip) return;

    const allowed = await isAllowed(ip);
    setHeader(event, 'x-ratelimit-limit', max);
    setHeader(event, 'x-ratelimit-remaining', remaining < 0 ? 0 : remaining);

    if (allowed) return cleanup();

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

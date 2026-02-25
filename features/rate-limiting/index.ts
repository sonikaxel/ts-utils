import { useStorage } from 'nitropack/runtime';

export * from './fixed-window';
export * from './sliding-window-log';

export type FixedWindowLimit = {
  count: number;
  startTime: number;
  endTime: number;
};

/** Fixed Window Rate limit storage */
export const FixedWindowLimitersStorage = useStorage<FixedWindowLimit>(
  'memory:fixedWindowLimiter',
);

export type SlidingWindowLimit = number[];

/** Siliding Window Log Rate limit storage */
export const SlidingWindowLimitersStorage = useStorage<SlidingWindowLimit>(
  'memory:slideingWindowLimiter',
);

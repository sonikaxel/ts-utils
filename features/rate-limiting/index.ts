export * from './fixed-window';
export * from './sliding-window-log';

export type IStorage<T, K extends PropertyKey = string> = {
  get: (key: K) => Promise<T | undefined>;
  set: (key: K, value: T) => Promise<void>;
  remove: (key: K) => Promise<void>;
  keys: () => Promise<K[]>;
  has: (key: K) => Promise<boolean>;
};

export function createLimiterIndentity(ip: string, name: string) {
  return `${ip}:${name}`;
}

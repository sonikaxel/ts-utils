export * from './products.types';

export type IStorage<T, K extends PropertyKey = string> = {
  get: (key: K) => Promise<T | undefined>;
  set: (key: K, value: T) => Promise<void>;
  remove: (key: K) => Promise<void>;
  keys: () => Promise<K[]>;
  has: (key: K) => Promise<boolean>;
};

export type ListItems<T> = {
  page: number;
  limit: number;
  total: number;
  data: T[];
};

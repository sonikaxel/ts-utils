import { useRuntimeConfig, useStorage } from 'nitropack/runtime';
import type { Storage } from 'unstorage';

/** Base for the storage,
 * can be replaced with runtime config by using `kvBase` key.
 */
const BASE = 'KV_STORE';

type IKVStoreValue<T> = {
  data: T;
  model?: string;
  /** Value expiry in timestamp (in ms),
   * `undefined` means do not expires.
   */
  expiresAt?: number;
};

type KVStoreValue<T> = {
  /** Original Data stored. */
  data: IKVStoreValue<T>['data'];
  /** Model name for identifying purpose.  */
  model?: IKVStoreValue<T>['model'];
  /** Time-to-Live (in seconds),
   * `undefined` means do not expires.
   */
  ttl?: number;
};

type KVStoreValueWithKey<T> = {
  key: string;
  value: KVStoreValue<T>;
};

/**
 * KV Storage using useStorage under a default base `KV_STORE`,
 * This base can be replaced by setting `kvBase` key in runtime config.
 *
 * **Note:** All values are stored in memory.
 * So if server crashed or restarted
 * then all values will cleared from the storage.
 */
export class KVStore<Value> {
  private store: Storage<IKVStoreValue<Value>>;
  public model: string | undefined;

  constructor(options: { model?: string } = {}) {
    const kvBase = (useRuntimeConfig() as { kvBase?: string }).kvBase;
    this.store = useStorage(kvBase ?? BASE);
    this.model = options.model;
  }

  /**
   * Get a non-expired value from storage.
   * @param key Key to find
   * @returns `KVStoreValue` if exists or `null`
   */
  async get(key: string): Promise<KVStoreValue<Value> | null> {
    const value = await this.store.get(key).catch((e) => {
      console.error('KVStore: fail to get value', e);
      return null;
    });

    // No value => null
    if (value == null) return null;

    const { expiresAt, ...rest } = value;

    if (expiresAt == null) {
      return {
        data: value.data,
        model: value.model,
        ttl: undefined,
      };
    }

    const now = Date.now();
    const ttl = Math.floor((expiresAt - now) / 1000);

    // Not expired => data
    if (ttl > 0) {
      return {
        ...rest,
        ttl,
      };
    }

    return null;
  }

  /**
   * Set a value in storage with a optional ttl (Time-to-Live).
   * @param key Key to indentify
   * @param value Value to store
   * @param ttl Time-to-Live (in seconds)
   */
  async set(key: string, value: Value, ttl?: number): Promise<void> {
    const expiresAt = ttl == null ? undefined : Date.now() + ttl * 1000;

    await this.store
      .set(key, {
        data: value,
        model: this.model,
        expiresAt,
      })
      .catch((e) => {
        console.error('KVStore: fail to set value', e);
      });
  }

  /**
   * Delete a value from storage.
   * @param key Key to delete
   */
  async delete(key: string): Promise<void> {
    await this.store.remove(key).catch((e) => {
      console.error('KVStore: fail to delete value', e);
    });
  }

  /**
   * Update a value in storage,
   * if value is expired or not exists then no update is done.
   * TTL will not be updated, it will remain same as it was set in first place.
   * @param key Key to find or update
   * @param newValue New value to update
   */
  async update(key: string, newValue: Value): Promise<void> {
    const existing = await this.get(key);

    // Not exists, no update
    if (existing == null) return;

    const { ttl } = existing;

    // No expiry was set, update new value directly without ttl
    if (ttl == null) {
      await this.set(key, newValue);
      return;
    }

    // Expired, no update required
    if (ttl < 1) return;

    // Not expired, update new value with existing ttl
    await this.set(key, newValue, ttl);
  }

  /** Get all keys, expired-keys may also be seen. */
  keys(): Promise<string[]> {
    return this.store.keys();
  }

  /** Clear all values from storage */
  async clear(): Promise<void> {
    await this.store.clear().catch((e) => {
      console.error('KVStore: fail to set value', e);
    });
  }

  /** Check if key exists in storage */
  has(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  /**
   * Get all available values, seperated in key and value property.
   * @returns Array of key and value
   */
  async getAll(): Promise<KVStoreValueWithKey<Value>[]> {
    const keys = await this.keys();

    let data: KVStoreValueWithKey<Value>[] = [];

    for (const key of keys) {
      const value = await this.get(key);

      if (value != null) {
        data.push({
          key,
          value,
        });
      }
    }

    return data;
  }
}

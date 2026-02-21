/**
 * Check whether given value is not `null` or `undefined`
 */
export function isNonNullable<T>(
  value: T | null | undefined,
): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

/**
 * Finds property (key) is a direct property of the object
 */
export function findKey<T extends PropertyKey>(obj: Object, key: T) {
  const hasKey = Object.hasOwn(obj, key);
  return hasKey ? key : undefined;
}

/**
 * Check whether given date is valid or not
 */
export function isValidDate(dtd: Date) {
  return dtd instanceof Date && dtd.getTime && !isNaN(dtd.getTime());
}

/**
 * Helper to convert bool string to boolean,
 * `undefined` on failure
 */
export function strToBoolean(data: string) {
  try {
    const val = data.toLowerCase();
    const json = JSON.parse(val);

    if (typeof json === 'boolean') return json;

    return undefined;
  } catch {
    return undefined;
  }
}

/** Get a unique list by specified key */
export function getUniqueListBy<T>(arr: T[], key: keyof T) {
  return [...new Map(arr.map((item) => [item[key], item])).values()];
}

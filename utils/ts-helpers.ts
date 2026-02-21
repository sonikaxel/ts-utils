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
  return Object.hasOwn(obj, key) ? key : undefined;
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
    const json = JSON.parse(data.toLowerCase());
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

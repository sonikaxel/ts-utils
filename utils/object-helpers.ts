/**
 * Match an object
 * @param source Source Object to match from
 * @param target Target object to match with
 * @deprecated use `getObjectChanges`
 */
export function matchObject<T extends Partial<Record<string, string>>>(
  source: T,
  target: {},
) {
  const keys = Object.keys(source);
  let matchedObject: Partial<Record<string, string>> = {};

  if (keys.length) {
    for (let key of keys) {
      const matchKey = Object.hasOwn(target, key) ? key : undefined;

      if (matchKey) {
        matchedObject[matchKey] = source[matchKey];
      }
    }
  }

  return matchedObject;
}

/** DeepPartial helper type */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

/** Find Changes from an object */
export function getObjectChanges<T extends Record<string, any>>(
  original: T,
  updated: T,
): DeepPartial<T> {
  const changes: Record<string, any> = {};

  for (const key of Object.keys(updated)) {
    const origVal = original[key];
    const updatedVal = updated[key];

    // 1. Primitive exact match check
    if (origVal === updatedVal) continue;

    // 2. Handle nested plain objects (excluding arrays)
    if (
      origVal &&
      updatedVal &&
      typeof origVal === 'object' &&
      typeof updatedVal === 'object' &&
      !Array.isArray(origVal) &&
      !Array.isArray(updatedVal)
    ) {
      const nestedChanges = getObjectChanges(origVal, updatedVal);
      if (Object.keys(nestedChanges).length > 0) {
        changes[key] = nestedChanges;
      }
    }
    // 3. Handle arrays (simple JSON equality check to see if contents differ)
    else if (Array.isArray(origVal) && Array.isArray(updatedVal)) {
      if (JSON.stringify(origVal) !== JSON.stringify(updatedVal)) {
        changes[key] = updatedVal; // Returns the full updated array
      }
    }
    // 4. Handle type mismatches or primitive changes
    else {
      changes[key] = updatedVal;
    }
  }

  return changes as DeepPartial<T>;
}

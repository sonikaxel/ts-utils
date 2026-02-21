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

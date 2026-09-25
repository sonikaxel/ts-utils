/**
 * Capitalize words
 * @param sentence any words or sentence
 * @param seperator with what sentence is seperated, default is ' '
 * @returns capitalize words or sentence
 * @example
 * capitalizeWords('hello WORLD') // Hello World
 * capitalizeWords('HELLO WORLD') // Hello World
 * capitalizeWords('HELLO_WORLD', '_') // Hello World
 */
export function capitalizeWords(sentence: string, seperator: string = ' ') {
  const words = sentence.toLowerCase().split(seperator);
  const capitalizedWords = words.map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1),
  );
  return capitalizedWords.join(' ');
}

/**
 * Generate Random ID
 * @param [size=16] max length of generated ID, default `16`
 * @param [prefix=''] prefix for generated ID, default `''`
 */
export function generateRandomId(size: number = 16, prefix: string = '') {
  const chars = '01234abcdfghijklMNOPQRSTUVWXYZmnopqrstuvwxyzABCDEFGHIJKL56789';
  let _size = prefix ? size - prefix.length - 1 : size;
  let id = '';

  let i = 0;
  while(i < _size) {
    const rand = Math.floor(Math.random() * chars.length);
    id += chars.charAt(rand);
    i++;
  }

  return prefix ? `${prefix}_${id}` : id;
};

/**
 * Match a path with given pattern.
 * @param path target path to match
 * @param pattern match pattern
 */
export function matchGlob(path: string, pattern: string): boolean {
  // 1. Check if the pattern ends with /**
  if (pattern.endsWith('/**')) {
    // Strip the '/**' and escape special regex characters
    const base = pattern.slice(0, -3).replace(/[.+^${}()|[\]\\]/g, '\\$&');
    // Match the base path exactly, OR the base path followed by a slash and anything else
    const regex = new RegExp(`^${base}(/.*)?$`);
    return regex.test(path);
  }

  // 2. Fallback for standard globs
  const regexPath = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*');

  return new RegExp(`^${regexPath}$`).test(path);
}

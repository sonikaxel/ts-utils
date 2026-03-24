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

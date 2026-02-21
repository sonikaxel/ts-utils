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

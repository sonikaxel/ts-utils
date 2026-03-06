/**
 * Converts a JSON string into an object without thowing error on {SyntaxError}
 * like `JSON.parse`.
 * @param text A valid JSON string.
 */
export function parseJSON<T = any>(text: string) {
  try {
    const data = JSON.parse(text) as unknown as T;
    return { data };
  } catch (e: unknown) {
    if (e instanceof Error) {
      return { error: e };
    }

    return { error: new Error('Invalid JSON input') };
  }
}

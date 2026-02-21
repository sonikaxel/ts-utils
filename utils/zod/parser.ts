import { ZodError, ZodType } from 'zod/v4';

type ZodParseReturn<T> = {
  /** Parse data with given schema, throws `Error` on failure */
  parse: (data: unknown) => T;
  /** Parse data without throwing `Error`,
   * instead return object with data & error.
   * Type of error is string
   */
  safeParse: (data: unknown) =>
    | T
    | {
        error: string;
      };
};

/**
 * Convert zod schema to parse function which throws an `Error` on failure, unlike zod parse which throws `ZodError`.
 * @param zodSchema Any Zod Schema
 * @returns functions for parsing
 * @example
 * const schema = z.object({
 *   age: z.number().max(28)
 * });
 *
 * const data = zodParser(schema).parse({ age: 25 }); // { age: 25 }
 * const data = zodParser(schema).parse({ age: 30 }); // throw Error instance
 *
 * // Validate query in nitro (H3)
 * const query = await getValidatedQuery(event, zodParser(schema).parse);
 */
export function zodParser<T>(zodSchema: ZodType<T>): ZodParseReturn<T> {
  /** Normal Parse */
  const parse = (data: unknown) => {
    const parsed = zodSchema.safeParse(data);

    if (parsed.error) {
      const { message } = zodErrorToObj(parsed.error);
      throw new Error(message);
    }

    return parsed.data;
  };

  /** Safe Parse */
  const safeParse = (data: unknown) => {
    const parsed = zodSchema.safeParse(data);

    if (parsed.error) {
      const { message } = zodErrorToObj(parsed.error);
      return { error: message };
    }

    return parsed.data;
  };

  return { parse, safeParse };
}

export function zodErrorToObj(e: ZodError) {
  const path = String(e.issues[0]?.path[0]);
  const message = e.issues[0]?.message || '';

  const pathMessage = `${path} - ${message}`;
  return { path, message, pathMessage };
}

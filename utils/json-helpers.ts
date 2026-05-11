import type z from 'zod';

type JSONPrimitive = string | number | null | undefined;

type JSONValue =
  | JSONPrimitive
  | JSONValue[]
  | {
      [key: string]: JSONValue;
    };

type NotAssignableJSON = bigint | symbol | Function;

type DatePrimitive = Date | JSONPrimitive | NotAssignableJSON;

type DateValue<T> = T extends Date
  ? string
  : T extends JSONPrimitive
    ? T
    : undefined;

export type JSONSerialize<T> = unknown extends T
  ? never
  : {
      [P in keyof T]: T[P] extends JSONValue
        ? T[P]
        : T[P] extends DatePrimitive
          ? DateValue<T[P]>
          : T[P] extends NotAssignableJSON
            ? undefined
            : JSONSerialize<T[P]>;
    };

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

export function parseJSONZod<T>(text: string, schema: z.ZodType<T>) {
  const { data, error } = parseJSON(text);

  if (error) return null;

  return schema.safeParse(data).data ?? null;
}

export function serializeJSON<T>(json: T): JSONSerialize<T> {
  return JSON.parse(JSON.stringify(json));
}

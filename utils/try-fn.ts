/** Result */
export type TryResult<E, S> = [null, S] | [E, null];

/** Success function */
export function ok<T>(data: T): TryResult<never, T> {
  return [null, data];
}

/** Error */
export type TryError<R extends string, D = unknown, N = 'TryError'> = {
  name?: N;
  reason: R;
  message?: string;
  details?: D;
  code?: string;
};

/** Error function */
export function err<const R extends string, E extends TryError<R>>(
  error: E,
): TryResult<E, never> {
  const _err: E = {
    name: 'TryError',
    ...error,
  };
  return [_err, null];
}

/** Try function options */
type TryFnOptions = {
  disableLogOnError?: boolean;
};

/** Resolve promise safely */
export async function tryFn<T>(fn: () => Promise<T>, opts: TryFnOptions = {}) {
  try {
    const result = await fn();
    return ok(result);
  } catch (e) {
    let _e =
      e instanceof Error
        ? e
        : new Error('An unknown error occurs during resolving of promise');

    if (!opts.disableLogOnError) {
      // log to console
      console.error(_e);
    }

    return err({
      reason: 'Promise_Rejected',
      details: _e,
    });
  }
}

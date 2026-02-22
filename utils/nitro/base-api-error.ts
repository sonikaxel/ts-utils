import { createError, H3Error } from 'h3';
import { FetchError } from 'ofetch';
import { capitalizeWords } from '..';
import { HTTPStatusCodes, type HTTPStatusCode } from '../status-codes';

/** Create an throwable API friendly error (H3Error) */
export function baseAPIError<T extends HTTPStatusCode>(
  statusCode: T,
  details: {
    message: string;
    statusText?: string;
    code?: string;
  },
) {
  let statusMessage = details.statusText || capitalizeWords(statusCode, '_');
  let status = HTTPStatusCodes[statusCode] || 500;
  let code = details.code;

  return createError({
    name: 'BaseAPIError',
    message: details.message,
    status,
    statusMessage,
    data: code ? { code } : undefined,
  });
}

/** Create an Error message, can be used in catch block */
export function determineError(error: unknown) {
  if (error instanceof FetchError) {
    return {
      message: (error.data.message ?? 'Fetch error') as string,
      payload: error,
    };
  }

  if (error instanceof H3Error) {
    return {
      message: error.message ?? 'Fetch error',
      payload: error,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      payload: error,
    };
  }

  return {
    message: 'Something went wrong',
  };
}

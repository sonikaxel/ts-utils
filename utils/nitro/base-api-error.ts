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
    let message = (error.data.message ?? 'Fetch error') as string;
    return {
      message,
      payload: error,
      error: new Error(message),
    };
  }

  if (error instanceof H3Error) {
    let message = error.message ?? 'Fetch error';
    return {
      message,
      payload: error,
      error: new Error(message),
    };
  }

  if (error instanceof Error) {
    let message = error.message;
    return {
      message,
      payload: error,
      error: new Error(message),
    };
  }

  let message = 'Something went wrong';
  return {
    message,
    error: new Error(message),
  };
}

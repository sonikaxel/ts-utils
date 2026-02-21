import { createError } from 'h3';
import { capitalizeWords } from '..';
import { HTTPStatusCodes, type HTTPStatusCode } from './status-codes';

export function baseAPIError(
  statusCode: HTTPStatusCode,
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

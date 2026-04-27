import { getRequestIP, H3Event } from 'h3';
import { z } from 'zod/v4';

/**
 * Try to get the client IP address from the incoming request.
 *
 * By default `xForwardedFor` is `true`.
 *
 * If `xForwardedFor` is true, it will use the `x-forwarded-for` header set by proxies if it exists.
 * If IP cannot be determined, it will default to `undefined`.
 * @param event H3Event
 * @example
 * export default defineEventHandler((event) => {
 *   const ip = getRequestIPAddress(event); // "192.128.1.21"
 * });
 */
export function getRequestIPAddress(event: H3Event) {
  const reqIp =
    getRequestIP(event) ?? getRequestIP(event, { xForwardedFor: true });
  return {
    original: reqIp,
    ip: determineIP(reqIp),
  };
}

/**
 * Determine the given `ip` is proper `ipv6` or `ipv4`,
 * then returns the appropriate `ip`.
 *
 * If given `ip` is mapped `ipv6` i.e. `::ffff:192.128.1.21`
 * which is `ipv4` mapped to `ipv6`, this will be converted to `ipv4`
 * @param ip `ip` address
 * @returns `ipv4` or `ipv6`
 */
export function determineIP(ip: string | undefined) {
  if (ip == null) return undefined;

  if (isIPv4(ip) != null) return ip;

  let ipv6 = isIPv6(ip);

  if (!ipv6) return undefined;

  // localhost ip
  if (ipv6 === '::1') return '127.0.0.1';

  const V6_MAPPED_PATTERN = '::ffff:';

  if (ipv6.startsWith(V6_MAPPED_PATTERN)) {
    // ipv4 but mapped to ipv6
    let ipv6Mapped = ipv6.replace(V6_MAPPED_PATTERN, '').trim();

    if (!ipv6Mapped) return undefined;

    return ipv6Mapped;
  }

  // ipv6
  return ipv6;
}

function isIPv4(ip: string) {
  return z.ipv4().safeParse(ip).data;
}

function isIPv6(ip: string) {
  return z.ipv6().safeParse(ip).data;
}

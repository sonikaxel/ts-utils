import { getRequestIP, H3Event } from 'h3';

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
export function getRequestIPAddress(
  event: H3Event,
  opts?: {
    xForwardedFor: boolean;
  },
) {
  let xForwardedFor = opts?.xForwardedFor ?? true;
  const reqIp = getRequestIP(event, { xForwardedFor });
  return determineIP(reqIp);
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

  // localhost ip
  if (ip === '::1') return '127.0.0.1';

  const V6_MAPPED_PATTERN = '::ffff:';

  if (ip.startsWith(V6_MAPPED_PATTERN)) {
    // ipv4 but mapped to ipv6
    return ip.replace(V6_MAPPED_PATTERN, '').trim();
  }

  // ipv6
  return ip;
}

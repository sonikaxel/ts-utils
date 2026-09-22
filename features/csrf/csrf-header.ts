import { H3Event, HTTPMethod } from "h3";

type CSRFOption = {
  /**
   * Whitelist the HTTP methods, any method in this list will skip the method validation.
   * Default ['GET', 'HEAD', 'OPTIONS']
   */
  safeMethods?: HTTPMethod[];
  /**
   * List of Origin allowed, any origin in this list will skip the origin validation.
   * During development, dev origin will added automatically.
   */
  trustedOrigins?: string[];
};

export function csrfHeaderCheck(event: H3Event, option?: CSRFOption) {
  let allowedOrigins = [...(option?.trustedOrigins ?? [])];

  if (import.meta.dev) {
    allowedOrigins = [
      "http://127.0.0.1:3000",
      "http://[::1]:3000",
      "http://localhost:3000",
      ...allowedOrigins,
    ];
  }

  const trustedOrigins = new Set(allowedOrigins);

  // 1. Skip safe HTTP methods
  const safeMethods = new Set([
    "GET",
    "HEAD",
    "OPTIONS",
    ...(option?.safeMethods || []),
  ]);

  if (safeMethods.has(event.method)) return true;

  // 2. Fetch Metadata: Sec-Fetch-Site check (Modern Browsers)
  const secFetchSite = getHeader(event, "sec-fetch-site");

  if (secFetchSite) {
    // Block cross-site requests immediately
    if (secFetchSite === "cross-site") {
      return createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: "Forbidden: Cross-site request blocked by Fetch Metadata.",
      });
    }

    // Optional: If you want to be extra strict about subdomains,
    // change this to strictly require 'same-origin' instead of 'same-site'
    if (secFetchSite === "same-origin" || secFetchSite === "same-site") {
      return true;
    }
  }

  // 3. Fallback: Validate standard Origin header
  const origin = getHeader(event, "origin");
  if (origin) {
    if (!trustedOrigins.has(origin)) {
      return createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: "Forbidden: Invalid request origin.",
      });
    }
    return true;
  }

  // 4. Fallback: Validate Referer header if Origin is missing
  const referer = getHeader(event, "referer");
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (!trustedOrigins.has(refererUrl.origin)) {
        return createError({
          statusCode: 403,
          statusMessage: "Forbidden",
          message: "Forbidden: Invalid request referrer.",
        });
      }
      return true;
    } catch (err) {
      return createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "Bad Request: Malformed Referer header.",
      });
    }
  }

  // 5. Final Fallback: If no browser security headers (Origin, Referer, Sec-Fetch-Site)
  // are present at all for a state-changing method, block it to prevent header-stripping bypasses.
  return createError({
    statusCode: 403,
    statusMessage: "Forbidden",
    message: "Forbidden: Missing required security headers.",
  });
}

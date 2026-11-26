import type { ErrorEvent } from '@sentry/nestjs';

const SENSITIVE_HEADERS = new Set([
  'authorization',
  'cookie',
  'proxy-authorization',
  'set-cookie',
  'x-api-key',
]);

/**
 * Error reports must never carry credentials or financial payloads. Express
 * request bodies can include passwords on /auth/* and query strings can carry
 * tokens, so both are removed entirely; only safe request metadata (method,
 * route, status) is kept.
 */
export function scrubSentryEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.query_string;

    if (event.request.headers) {
      for (const header of Object.keys(event.request.headers)) {
        if (SENSITIVE_HEADERS.has(header.toLowerCase())) {
          delete event.request.headers[header];
        }
      }
    }
  }

  if (event.user) {
    delete event.user.email;
    delete event.user.username;
    delete event.user.ip_address;
  }

  return event;
}

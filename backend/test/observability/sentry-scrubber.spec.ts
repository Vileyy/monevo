import type { ErrorEvent } from '@sentry/nestjs';
import { scrubSentryEvent } from '../../src/observability/sentry-scrubber';

function eventWithRequest(): ErrorEvent {
  return {
    request: {
      method: 'POST',
      url: 'https://api.monevoapp.me/auth/login',
      data: { email: 'user@example.com', password: 'super-secret' },
      query_string: 'token=leaked',
      cookies: { session: 'leaked' },
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer leaked-token',
        cookie: 'session=leaked',
        'x-api-key': 'leaked-key',
      },
    },
    user: {
      id: 'user-1',
      email: 'user@example.com',
      username: 'user',
      ip_address: '203.0.113.10',
    },
  } as ErrorEvent;
}

describe('scrubSentryEvent', () => {
  it('removes bodies, query strings, cookies and sensitive headers', () => {
    const event = scrubSentryEvent(eventWithRequest());

    expect(event.request?.data).toBeUndefined();
    expect(event.request?.query_string).toBeUndefined();
    expect(event.request?.cookies).toBeUndefined();
    expect(event.request?.headers?.authorization).toBeUndefined();
    expect(event.request?.headers?.cookie).toBeUndefined();
    expect(event.request?.headers?.['x-api-key']).toBeUndefined();
  });

  it('keeps safe request metadata for debugging', () => {
    const event = scrubSentryEvent(eventWithRequest());

    expect(event.request?.method).toBe('POST');
    expect(event.request?.url).toBe('https://api.monevoapp.me/auth/login');
    expect(event.request?.headers?.['content-type']).toBe('application/json');
  });

  it('removes identifying user fields', () => {
    const event = scrubSentryEvent(eventWithRequest());

    expect(event.user?.id).toBe('user-1');
    expect(event.user?.email).toBeUndefined();
    expect(event.user?.username).toBeUndefined();
    expect(event.user?.ip_address).toBeUndefined();
  });

  it('handles events without request or user data', () => {
    expect(() => scrubSentryEvent({ message: 'boom' })).not.toThrow();
  });
});

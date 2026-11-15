import { apiClient } from '@/services/api/client';
import {
  buildSessionUser,
  exchangeClerkToken,
  isRetryableExchangeError,
  SESSION_EXCHANGE_RETRY_MS,
  SESSION_EXCHANGE_TIMEOUT_MS,
} from '@/features/auth/utils/session';

jest.mock('@/services/api/client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

const apiPost = apiClient.post as jest.Mock;

const apiSession = {
  user: { id: 'user_1', email: 'user@example.com', name: 'Hieu' },
  accessToken: 'monevo_jwt',
};

describe('exchangeClerkToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('returns the API session for a valid Clerk token', async () => {
    apiPost.mockResolvedValue({ data: apiSession });

    await expect(exchangeClerkToken('clerk_token', 'Hieu')).resolves.toEqual(
      apiSession,
    );
    expect(apiPost).toHaveBeenCalledWith(
      '/auth/clerk',
      {
        clerkToken: 'clerk_token',
        name: 'Hieu',
      },
      { timeout: SESSION_EXCHANGE_TIMEOUT_MS },
    );
  });

  it('retries transient network failures', async () => {
    jest.useFakeTimers();
    apiPost
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce({ data: apiSession });

    const request = exchangeClerkToken('clerk_retry');
    await jest.advanceTimersByTimeAsync(SESSION_EXCHANGE_RETRY_MS);

    await expect(request).resolves.toEqual(apiSession);
    expect(apiPost).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  it('does not retry a rejected Clerk session', async () => {
    const unauthorized = Object.assign(new Error('Invalid Clerk token'), {
      response: { status: 401 },
    });
    apiPost.mockRejectedValue(unauthorized);

    await expect(exchangeClerkToken('clerk_bad')).rejects.toBe(unauthorized);
    expect(apiPost).toHaveBeenCalledTimes(1);
  });

  it('fails with a connection message instead of a Clerk token', async () => {
    jest.useFakeTimers();
    apiPost.mockRejectedValue(new Error('Network Error'));

    const request = exchangeClerkToken('clerk_offline');
    const assertion = expect(request).rejects.toThrow('Could not reach Monevo');
    await jest.advanceTimersByTimeAsync(SESSION_EXCHANGE_RETRY_MS * 3);
    await assertion;

    expect(apiPost).toHaveBeenCalledTimes(3);
    jest.useRealTimers();
  });

  it('shares one request when both sign-in screens finish the same flow', async () => {
    let resolve!: (value: { data: typeof apiSession }) => void;
    apiPost.mockImplementation(
      () =>
        new Promise<{ data: typeof apiSession }>((done) => {
          resolve = done;
        }),
    );

    const first = exchangeClerkToken('clerk_shared');
    const second = exchangeClerkToken('clerk_shared');
    expect(apiPost).toHaveBeenCalledTimes(1);

    resolve({ data: apiSession });
    await expect(Promise.all([first, second])).resolves.toEqual([
      apiSession,
      apiSession,
    ]);
  });

  it('rejects an empty Clerk token without calling the API', async () => {
    await expect(exchangeClerkToken('')).rejects.toThrow(
      'Missing Clerk session token',
    );
    expect(apiPost).not.toHaveBeenCalled();
  });
});

describe('isRetryableExchangeError', () => {
  it('retries network, timeout, 429 and 5xx errors', () => {
    expect(isRetryableExchangeError(new Error('Network Error'))).toBe(true);
    expect(isRetryableExchangeError({ response: { status: 429 } })).toBe(true);
    expect(isRetryableExchangeError({ response: { status: 503 } })).toBe(true);
  });

  it('does not retry client errors', () => {
    expect(isRetryableExchangeError({ response: { status: 400 } })).toBe(false);
    expect(isRetryableExchangeError({ response: { status: 401 } })).toBe(false);
  });
});

describe('buildSessionUser', () => {
  const fallback = {
    email: 'fallback@example.com',
    name: 'Hieu Nguyen',
    avatarUrl: 'https://img.clerk.com/avatar.png',
  };

  it('keeps a real API name and attaches the Clerk avatar', () => {
    expect(buildSessionUser(apiSession, fallback)).toEqual({
      id: 'user_1',
      email: 'user@example.com',
      name: 'Hieu',
      avatarUrl: 'https://img.clerk.com/avatar.png',
    });
  });

  it('replaces placeholder names with the profile name', () => {
    expect(
      buildSessionUser(
        {
          ...apiSession,
          user: { ...apiSession.user, name: 'Google User' },
        },
        fallback,
      ).name,
    ).toBe('Hieu Nguyen');
  });

  it('falls back to the Clerk email when the API omits one', () => {
    expect(
      buildSessionUser(
        {
          ...apiSession,
          user: { ...apiSession.user, email: '' },
        },
        fallback,
      ).email,
    ).toBe('fallback@example.com');
  });
});

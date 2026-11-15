import { apiClient } from '@/services/api/client';
import type { User } from '@/store/auth.store';

/**
 * The API handshake that turns a Clerk session into a Monevo access token.
 *
 * A Clerk JWT is *not* a valid API bearer token (the Nest guard verifies its
 * own signed JWT), so it must never be stored in the auth store. Storing it
 * makes every request fail with 401 moments after a successful sign-in, which
 * looks like the app signing the user out again.
 */
export type ApiSession = {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  accessToken: string;
};

export type SessionFallback = {
  email: string;
  name: string;
  avatarUrl?: string;
};

export const SESSION_EXCHANGE_ATTEMPTS = 3;
export const SESSION_EXCHANGE_RETRY_MS = 400;
// The default 10s API timeout would keep the sign-in spinner up for half a
// minute across three attempts when the network black-holes.
export const SESSION_EXCHANGE_TIMEOUT_MS = 6000;

const PLACEHOLDER_NAMES = new Set([
  'Google User',
  'Member',
  'Monevo User',
  'Monevo Member',
]);

const CONNECTION_ERROR =
  'Could not reach Monevo. Check your connection and try again.';

function statusOf(error: unknown): number | undefined {
  return (error as { response?: { status?: number } })?.response?.status;
}

/** Network failures, timeouts, 429 and 5xx are worth retrying; 4xx are not. */
export function isRetryableExchangeError(error: unknown): boolean {
  const status = statusOf(error);
  if (status === undefined) return true;
  return status === 429 || status >= 500;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exchange a Clerk session token for a Monevo API token, retrying transient
 * failures. Throws when the API never returns a usable session, so callers
 * keep the user on the sign-in screen instead of entering a half-signed-in
 * state.
 */
export async function exchangeClerkToken(
  clerkToken: string,
  name?: string,
): Promise<ApiSession> {
  if (!clerkToken) {
    throw new Error('Missing Clerk session token.');
  }

  // The callback route and the sign-in screen can both finish the same OAuth
  // hand-off. Share one request instead of hitting the API twice.
  if (pendingExchange?.token === clerkToken) {
    return pendingExchange.promise;
  }

  const promise = performExchange(clerkToken, name);
  const clear = () => {
    if (pendingExchange?.promise === promise) pendingExchange = null;
  };
  pendingExchange = { token: clerkToken, promise };
  void promise.then(clear, clear);
  return promise;
}

let pendingExchange: { token: string; promise: Promise<ApiSession> } | null =
  null;

async function performExchange(
  clerkToken: string,
  name?: string,
): Promise<ApiSession> {
  let lastError: unknown;

  for (let attempt = 0; attempt < SESSION_EXCHANGE_ATTEMPTS; attempt++) {
    try {
      const { data } = await apiClient.post<ApiSession>(
        '/auth/clerk',
        { clerkToken, name },
        { timeout: SESSION_EXCHANGE_TIMEOUT_MS },
      );

      if (data?.accessToken && data?.user?.id) {
        return data;
      }

      lastError = new Error('The server did not return an access token.');
    } catch (error) {
      lastError = error;
      if (!isRetryableExchangeError(error)) break;
    }

    if (attempt < SESSION_EXCHANGE_ATTEMPTS - 1) {
      await sleep(SESSION_EXCHANGE_RETRY_MS * (attempt + 1));
    }
  }

  // A 401 means the Clerk session itself is invalid; surface the real reason.
  if (statusOf(lastError) === 401) {
    throw lastError;
  }
  throw new Error(CONNECTION_ERROR);
}

/** Merge the API user with the profile data Clerk already exposed. */
export function buildSessionUser(
  session: ApiSession,
  fallback: SessionFallback,
): User {
  const apiName = session.user.name?.trim();
  const name =
    apiName && !PLACEHOLDER_NAMES.has(apiName) ? apiName : fallback.name;

  return {
    id: session.user.id,
    email: session.user.email || fallback.email,
    name,
    avatarUrl: fallback.avatarUrl,
  };
}

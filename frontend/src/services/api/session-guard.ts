/**
 * A 401 only means the *current* session is invalid.
 *
 * Requests fired before a fresh sign-in can resolve late with a 401 for the
 * previous token; clearing the store then would throw away a valid new session
 * and bounce the user back to the login screen. Only sign out when the failed
 * request actually carried the token that is currently stored.
 */
export function shouldClearSession(
  authorizationHeader: unknown,
  currentToken: string | null,
): boolean {
  if (!currentToken) return false;
  if (typeof authorizationHeader !== 'string') return false;

  return authorizationHeader === `Bearer ${currentToken}`;
}

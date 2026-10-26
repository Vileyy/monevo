/**
 * Clerk can stall on a cold or flaky network. After this delay the app opens
 * without it, so the splash screen can never trap the user on white.
 */
export const CLERK_LOAD_TIMEOUT_MS = 5000;

export function isClerkReady(isLoaded: boolean, hasTimedOut: boolean): boolean {
  return isLoaded || hasTimedOut;
}

export function shouldDismissSplash(state: {
  introDone: boolean;
  isHydrated: boolean;
  clerkReady: boolean;
}): boolean {
  return state.introDone && state.isHydrated && state.clerkReady;
}

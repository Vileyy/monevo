/**
 * Clerk can stall on a cold or flaky network. After this delay the app opens
 * without it, so the splash screen can never trap the user on white.
 */
export const CLERK_LOAD_TIMEOUT_MS = 5000;

export function isClerkReady(isLoaded: boolean, hasTimedOut: boolean): boolean {
  return isLoaded || hasTimedOut;
}

/**
 * A restored API session is enough to render the app: Clerk is only needed to
 * create a new session. Skipping the Clerk wait on every warm start removes up
 * to five seconds of splash screen on a slow network.
 */
export function shouldWaitForClerk(state: {
  clerkLoaded: boolean;
  apiSessionRestored: boolean;
  clerkTimedOut: boolean;
}): boolean {
  return (
    !state.clerkLoaded && !state.apiSessionRestored && !state.clerkTimedOut
  );
}

export function shouldDismissSplash(state: {
  introDone: boolean;
  isHydrated: boolean;
  clerkReady: boolean;
}): boolean {
  return state.introDone && state.isHydrated && state.clerkReady;
}

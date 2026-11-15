import {
  CLERK_LOAD_TIMEOUT_MS,
  isClerkReady,
  shouldDismissSplash,
  shouldWaitForClerk,
} from '@/lib/startup';

describe('startup readiness', () => {
  describe('isClerkReady', () => {
    it('stays closed while Clerk is loading and the timeout has not fired', () => {
      expect(isClerkReady(false, false)).toBe(false);
    });

    it('opens as soon as Clerk loads', () => {
      expect(isClerkReady(true, false)).toBe(true);
    });

    it('opens when Clerk never loads but the timeout fired', () => {
      expect(isClerkReady(false, true)).toBe(true);
    });

    it('stays open once both signals are true', () => {
      expect(isClerkReady(true, true)).toBe(true);
    });
  });

  describe('shouldDismissSplash', () => {
    it('dismisses only after the intro, the session read and Clerk are all done', () => {
      expect(
        shouldDismissSplash({
          introDone: true,
          isHydrated: true,
          clerkReady: true,
        }),
      ).toBe(true);
    });

    it('keeps the splash while the intro animation is still running', () => {
      expect(
        shouldDismissSplash({
          introDone: false,
          isHydrated: true,
          clerkReady: true,
        }),
      ).toBe(false);
    });

    it('keeps the splash while the stored session is still being read', () => {
      expect(
        shouldDismissSplash({
          introDone: true,
          isHydrated: false,
          clerkReady: true,
        }),
      ).toBe(false);
    });

    it('keeps the splash while Clerk is still loading inside the wait window', () => {
      expect(
        shouldDismissSplash({
          introDone: true,
          isHydrated: true,
          clerkReady: isClerkReady(false, false),
        }),
      ).toBe(false);
    });

    it('dismisses a stalled Clerk load once the timeout has fired', () => {
      expect(
        shouldDismissSplash({
          introDone: true,
          isHydrated: true,
          clerkReady: isClerkReady(false, true),
        }),
      ).toBe(true);
    });
  });

  describe('shouldWaitForClerk', () => {
    it('waits while Clerk is the only way to get a session', () => {
      expect(
        shouldWaitForClerk({
          clerkLoaded: false,
          apiSessionRestored: false,
          clerkTimedOut: false,
        }),
      ).toBe(true);
    });

    it('renders a restored API session without waiting for Clerk', () => {
      expect(
        shouldWaitForClerk({
          clerkLoaded: false,
          apiSessionRestored: true,
          clerkTimedOut: false,
        }),
      ).toBe(false);
    });

    it('opens as soon as Clerk loads or the timeout fires', () => {
      expect(
        shouldWaitForClerk({
          clerkLoaded: true,
          apiSessionRestored: false,
          clerkTimedOut: false,
        }),
      ).toBe(false);
      expect(
        shouldWaitForClerk({
          clerkLoaded: false,
          apiSessionRestored: false,
          clerkTimedOut: true,
        }),
      ).toBe(false);
    });
  });

  it('caps the wait for Clerk at 5 seconds', () => {
    expect(CLERK_LOAD_TIMEOUT_MS).toBe(5000);
  });
});

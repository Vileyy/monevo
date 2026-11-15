import { shouldClearSession } from '@/services/api/session-guard';

describe('shouldClearSession', () => {
  it('signs out when the failed request carried the current token', () => {
    expect(shouldClearSession('Bearer current', 'current')).toBe(true);
  });

  it('ignores a late 401 from the previous session', () => {
    expect(shouldClearSession('Bearer previous', 'current')).toBe(false);
  });

  it('never clears a session for an unauthenticated request', () => {
    expect(shouldClearSession(undefined, 'current')).toBe(false);
    expect(shouldClearSession('Bearer previous', null)).toBe(false);
  });

  it('ignores non-string headers', () => {
    expect(shouldClearSession(['Bearer current'], 'current')).toBe(false);
  });
});

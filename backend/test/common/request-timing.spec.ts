import {
  createRequestTiming,
  getRequestTiming,
  recordDatabaseQuery,
  runWithRequestTiming,
} from '../../src/common/profiling/request-timing';

describe('request-timing', () => {
  it('accumulates query duration and count inside a request scope', () => {
    const timing = createRequestTiming();

    runWithRequestTiming(timing, () => {
      recordDatabaseQuery(3.5);
      recordDatabaseQuery(1.25);
    });

    expect(timing.dbQueries).toBe(2);
    expect(timing.dbMs).toBeCloseTo(4.75);
    expect(timing.slowestQueryMs).toBeCloseTo(3.5);
  });

  it('exposes the active timing to nested async calls', async () => {
    const timing = createRequestTiming();

    await runWithRequestTiming(timing, async () => {
      await Promise.resolve();
      recordDatabaseQuery(7);
      expect(getRequestTiming()).toBe(timing);
    });

    expect(timing.dbMs).toBe(7);
  });

  it('ignores queries outside a request scope', () => {
    expect(() => recordDatabaseQuery(10)).not.toThrow();
    expect(getRequestTiming()).toBeUndefined();
  });

  it('ignores non-finite durations', () => {
    const timing = createRequestTiming();

    runWithRequestTiming(timing, () => {
      recordDatabaseQuery(Number.NaN);
      recordDatabaseQuery(Number.POSITIVE_INFINITY);
    });

    expect(timing.dbQueries).toBe(0);
    expect(timing.dbMs).toBe(0);
  });
});

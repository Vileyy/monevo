import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request performance counters.
 *
 * Both fields are filled by the Prisma query event handler, which runs inside
 * the request's async context. That lets the timing interceptor report how much
 * of a request was spent in the database versus in application code, without
 * threading a client through every service.
 */
export interface RequestTiming {
  /** Sum of every Prisma query duration seen during the request, in ms. */
  dbMs: number;
  dbQueries: number;
  slowestQueryMs: number;
}

const storage = new AsyncLocalStorage<RequestTiming>();

export function createRequestTiming(): RequestTiming {
  return { dbMs: 0, dbQueries: 0, slowestQueryMs: 0 };
}

export function runWithRequestTiming<T>(timing: RequestTiming, fn: () => T): T {
  return storage.run(timing, fn);
}

export function getRequestTiming(): RequestTiming | undefined {
  return storage.getStore();
}

/**
 * Adds one Prisma query to the active request, if there is one.
 *
 * Queries issued outside a request (seeds, cron jobs, startup hooks) are
 * ignored on purpose: they have no request to attribute the cost to.
 */
export function recordDatabaseQuery(durationMs: number): void {
  const timing = storage.getStore();
  if (!timing || !Number.isFinite(durationMs)) return;

  timing.dbMs += durationMs;
  timing.dbQueries += 1;
  if (durationMs > timing.slowestQueryMs) {
    timing.slowestQueryMs = durationMs;
  }
}

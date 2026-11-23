import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import {
  RequestTiming,
  createRequestTiming,
  runWithRequestTiming,
} from '../profiling/request-timing';

/**
 * Adds a `Server-Timing` header to every HTTP response:
 *
 *   Server-Timing: app;dur=12.4, db;dur=8.1, dbq;desc="3"
 *
 * `app` is the handler duration (everything Nest does before serializing),
 * `db` is the time spent inside Prisma, `dbq` the number of queries. The
 * difference is the real cost of the framework, so a benchmark can tell
 * whether tuning Node (or replacing it) would ever matter.
 *
 * Requests slower than `SLOW_REQUEST_MS` (default 500) are logged as warnings.
 */
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TimingInterceptor.name);
  private readonly slowRequestMs = Number(process.env.SLOW_REQUEST_MS ?? 500);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const timing = createRequestTiming();
    const startedAt = process.hrtime.bigint();
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      const totalMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
      this.setServerTiming(response, totalMs, timing);
      this.logSlowRequest(request, totalMs, timing);
    };

    // Subscribing inside the AsyncLocalStorage scope is what keeps Prisma query
    // events attributable to this request; `defer` alone would only wrap the
    // creation of the observable, not the handler that runs on subscribe.
    const source = new Observable<unknown>((subscriber) => {
      const subscription = runWithRequestTiming(timing, () =>
        next.handle().subscribe(subscriber),
      );
      return () => subscription.unsubscribe();
    });

    return source.pipe(tap({ next: finish, error: finish, complete: finish }));
  }

  private setServerTiming(
    response: Response,
    totalMs: number,
    timing: RequestTiming,
  ): void {
    if (response.headersSent) return;

    const value = [
      `app;dur=${totalMs.toFixed(1)}`,
      `db;dur=${timing.dbMs.toFixed(1)}`,
      `dbq;desc="${timing.dbQueries}"`,
    ].join(', ');
    response.setHeader('Server-Timing', value);
  }

  private logSlowRequest(
    request: Request,
    totalMs: number,
    timing: RequestTiming,
  ): void {
    if (totalMs < this.slowRequestMs) return;

    const route = request.route as { path?: string } | undefined;
    const path = route?.path ?? request.originalUrl ?? request.url;
    this.logger.warn(
      `slow ${request.method} ${path} ${totalMs.toFixed(1)}ms ` +
        `(db ${timing.dbMs.toFixed(1)}ms / ${timing.dbQueries} queries, ` +
        `slowest ${timing.slowestQueryMs.toFixed(1)}ms)`,
    );
  }
}

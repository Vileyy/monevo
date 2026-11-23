import { ExecutionContext, Logger } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { TimingInterceptor } from '../../src/common/interceptors/timing.interceptor';
import { recordDatabaseQuery } from '../../src/common/profiling/request-timing';

interface FakeResponse {
  headersSent: boolean;
  headers: Record<string, string>;
  setHeader: (name: string, value: string) => void;
}

function createContext(
  response: FakeResponse,
  type: 'http' | 'rpc' = 'http',
): ExecutionContext {
  return {
    getType: () => type,
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'GET',
        url: '/transactions?page=1',
        originalUrl: '/transactions?page=1',
        route: { path: '/transactions' },
      }),
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;
}

function createResponse(): FakeResponse {
  const headers: Record<string, string> = {};
  return {
    headersSent: false,
    headers,
    setHeader: (name, value) => {
      headers[name] = value;
    },
  };
}

const run = <T>(
  interceptor: TimingInterceptor,
  context: ExecutionContext,
  handler: Observable<T>,
): Promise<T> =>
  new Promise((resolve, reject) => {
    interceptor
      .intercept(context, { handle: () => handler })
      .subscribe({ next: resolve, error: reject });
  });

describe('TimingInterceptor', () => {
  const interceptor = new TimingInterceptor();

  it('reports app and database time in a Server-Timing header', async () => {
    const response = createResponse();

    const result = await run(
      interceptor,
      createContext(response),
      of('ok').pipe(),
    );

    expect(result).toBe('ok');
    expect(response.headers['Server-Timing']).toMatch(
      /^app;dur=\d+\.\d, db;dur=0\.0, dbq;desc="0"$/,
    );
  });

  it('attributes Prisma query time issued inside the handler', async () => {
    const response = createResponse();

    await run(
      interceptor,
      createContext(response),
      new Observable((subscriber) => {
        recordDatabaseQuery(12.5);
        recordDatabaseQuery(2.5);
        subscriber.next('ok');
        subscriber.complete();
      }),
    );

    expect(response.headers['Server-Timing']).toContain('db;dur=15.0');
    expect(response.headers['Server-Timing']).toContain('dbq;desc="2"');
  });

  it('keeps the timing scope open across async handlers', async () => {
    const response = createResponse();

    await run(
      interceptor,
      createContext(response),
      new Observable<string>((subscriber) => {
        void (async () => {
          await Promise.resolve();
          recordDatabaseQuery(4);
          subscriber.next('ok');
          subscriber.complete();
        })();
      }),
    );

    expect(response.headers['Server-Timing']).toContain('dbq;desc="1"');
  });

  it('sets the header on errors and rethrows', async () => {
    const response = createResponse();

    await expect(
      run(
        interceptor,
        createContext(response),
        throwError(() => new Error('boom')),
      ),
    ).rejects.toThrow('boom');
    expect(response.headers['Server-Timing']).toContain('app;dur=');
  });

  it('does not touch non-http contexts', async () => {
    const response = createResponse();

    await run(interceptor, createContext(response, 'rpc'), of('ok'));

    expect(response.headers['Server-Timing']).toBeUndefined();
  });

  it('skips the header when the response is already sent', async () => {
    const response = createResponse();
    response.headersSent = true;

    await run(interceptor, createContext(response), of('ok'));

    expect(response.headers['Server-Timing']).toBeUndefined();
  });

  it('warns about slow requests', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    process.env.SLOW_REQUEST_MS = '0';
    const slowAware = new TimingInterceptor();
    delete process.env.SLOW_REQUEST_MS;

    await run(slowAware, createContext(createResponse()), of('ok'));

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('slow GET /transactions'),
    );
    warn.mockRestore();
  });
});

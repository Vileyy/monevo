import { ServiceUnavailableException } from '@nestjs/common';
import {
  CURRENCY_RATE_PROVIDERS,
  CurrencyService,
  RATE_CACHE_TTL_MS,
} from '../../src/currency/currency.service';

function jsonResponse(payload: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(payload),
  } as Response;
}

describe('CurrencyService', () => {
  let service: CurrencyService;

  beforeEach(() => {
    service = new CurrencyService();
    jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps only supported, valid rates from the provider', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      jsonResponse({
        date: '2026-10-25',
        vnd: {
          usd: 0.000038,
          eur: 0.000035,
          jpy: 0.0058,
          xyz: 42,
          aud: 0,
          sgd: -1,
        },
      }),
    );

    const result = await service.getRates();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(CURRENCY_RATE_PROVIDERS[0]);
    expect(result).toMatchObject({
      base: 'VND',
      date: '2026-10-25',
      rates: { USD: 0.000038, EUR: 0.000035, JPY: 0.0058 },
    });
  });

  it('falls back to the next provider when the first one fails', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(jsonResponse({}, false, 503))
      .mockResolvedValueOnce(jsonResponse({ vnd: { usd: 0.00004 } }));

    const result = await service.getRates();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe(CURRENCY_RATE_PROVIDERS[1]);
    expect(result.rates).toEqual({ USD: 0.00004 });
  });

  it('serves cached rates without refetching within the TTL', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(jsonResponse({ vnd: { usd: 0.00004 } }));

    await service.getRates();
    jest.spyOn(Date, 'now').mockReturnValue(1_000_000 + RATE_CACHE_TTL_MS - 1);
    await service.getRates();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns the stale cache when every provider fails after the TTL', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ vnd: { usd: 0.00004 } }))
      .mockRejectedValue(new TypeError('network down'));

    const first = await service.getRates();
    jest.spyOn(Date, 'now').mockReturnValue(1_000_000 + RATE_CACHE_TTL_MS + 1);
    const second = await service.getRates();

    expect(second).toEqual(first);
  });

  it('throws 503 when no provider works and nothing is cached', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockRejectedValue(new TypeError('network down'));

    await expect(service.getRates()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('ignores payloads without supported rates', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(jsonResponse({ vnd: { xyz: 1 } }));

    await expect(service.getRates()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});

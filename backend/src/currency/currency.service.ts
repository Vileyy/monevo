import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

/** Currency data is stored in VND; every other code is a display conversion. */
export const BASE_CURRENCY = 'VND';

/** Open-source, key-less rate feed (https://github.com/fawazahmed0/exchange-api). */
export const CURRENCY_RATE_PROVIDERS = [
  'https://latest.currency-api.pages.dev/v1/currencies/vnd.json',
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/vnd.json',
];

export const SUPPORTED_RATE_CODES = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'KRW',
  'AUD',
  'SGD',
] as const;

export const RATE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const PROVIDER_TIMEOUT_MS = 5_000;

interface ProviderPayload {
  date?: string;
  vnd?: Record<string, number>;
}

export interface CurrencyRates {
  base: typeof BASE_CURRENCY;
  date: string | null;
  rates: Record<string, number>;
  fetchedAt: string;
}

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private cached: CurrencyRates | null = null;
  private cachedAt = 0;

  async getRates(): Promise<CurrencyRates> {
    if (this.cached && Date.now() - this.cachedAt < RATE_CACHE_TTL_MS) {
      return this.cached;
    }

    try {
      const fresh = await this.fetchRates();
      this.cached = fresh;
      this.cachedAt = Date.now();
      return fresh;
    } catch (error: unknown) {
      if (this.cached) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Using stale currency rates: ${message}`);
        return this.cached;
      }
      this.logger.error(
        `Currency rates unavailable: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new ServiceUnavailableException(
        'Currency rates are unavailable right now.',
      );
    }
  }

  private async fetchRates(): Promise<CurrencyRates> {
    let lastError: unknown;

    for (const url of CURRENCY_RATE_PROVIDERS) {
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
        });
        if (!response.ok) {
          throw new Error(`Provider responded ${response.status}`);
        }

        const payload = (await response.json()) as ProviderPayload;
        const rates = pickSupportedRates(payload.vnd);
        if (Object.keys(rates).length === 0) {
          throw new Error('Provider returned no supported rates');
        }

        return {
          base: BASE_CURRENCY,
          date: payload.date ?? null,
          rates,
          fetchedAt: new Date().toISOString(),
        };
      } catch (error: unknown) {
        lastError = error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('No currency provider reachable');
  }
}

function pickSupportedRates(
  raw: Record<string, number> | undefined,
): Record<string, number> {
  const rates: Record<string, number> = {};
  if (!raw) return rates;

  for (const code of SUPPORTED_RATE_CODES) {
    const value = raw[code.toLowerCase()];
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      rates[code] = value;
    }
  }
  return rates;
}

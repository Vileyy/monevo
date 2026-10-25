import { create } from "zustand";
import { apiClient } from "@/services/api/client";
import { getStorage, saveStorage } from "@/lib/persistent-storage";
import { CurrencyCode, SUPPORTED_CURRENCIES } from "@/lib/currencies";
import { BASE_CURRENCY, RateMap } from "@/lib/currency-conversion";

const RATES_STORAGE_KEY = "monevo_currency_rates";

/** Same open-source feed the API proxies, used when the API build is stale. */
const PUBLIC_RATE_URLS = [
  "https://latest.currency-api.pages.dev/v1/currencies/vnd.json",
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/vnd.json",
];

const PUBLIC_FEED_TIMEOUT_MS = 8_000;

const CONVERTIBLE_CODES = new Set(
  SUPPORTED_CURRENCIES.map((config) => config.code).filter(
    (code) => code !== BASE_CURRENCY,
  ),
);

interface RatesPayload {
  base?: string;
  date?: string | null;
  rates?: Record<string, number>;
  fetchedAt?: string;
}

interface PublicFeedPayload {
  date?: string;
  vnd?: Record<string, number>;
}

interface CurrencyState {
  rates: RateMap;
  date: string | null;
  fetchedAt: string | null;
  isLoading: boolean;
  restoreRates: () => Promise<void>;
  refreshRates: () => Promise<void>;
}

export function sanitizeRates(raw: unknown): RateMap {
  if (!raw || typeof raw !== "object") return {};

  const rates: RateMap = {};
  for (const [key, value] of Object.entries(raw)) {
    const code = key.toUpperCase() as CurrencyCode;
    if (
      CONVERTIBLE_CODES.has(code) &&
      typeof value === "number" &&
      Number.isFinite(value) &&
      value > 0
    ) {
      rates[code] = value;
    }
  }
  return rates;
}

async function fetchFromApi(): Promise<RatesPayload | null> {
  try {
    const { data } = await apiClient.get<RatesPayload>("/currency/rates");
    return data ?? null;
  } catch {
    return null;
  }
}

async function fetchFromPublicFeed(): Promise<RatesPayload | null> {
  for (const url of PUBLIC_RATE_URLS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PUBLIC_FEED_TIMEOUT_MS);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) continue;

      const payload = (await response.json()) as PublicFeedPayload;
      if (!payload?.vnd) continue;

      return {
        base: BASE_CURRENCY,
        date: payload.date ?? null,
        rates: payload.vnd,
        fetchedAt: new Date().toISOString(),
      };
    } catch {
      // Try the next mirror.
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  rates: {},
  date: null,
  fetchedAt: null,
  isLoading: false,

  restoreRates: async () => {
    const raw = await getStorage(RATES_STORAGE_KEY);
    if (!raw) return;

    try {
      const cached = JSON.parse(raw) as RatesPayload;
      set({
        rates: sanitizeRates(cached.rates),
        date: cached.date ?? null,
        fetchedAt: cached.fetchedAt ?? null,
      });
    } catch {}
  },

  refreshRates: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });

    try {
      let payload = await fetchFromApi();
      if (Object.keys(sanitizeRates(payload?.rates)).length === 0) {
        payload = await fetchFromPublicFeed();
      }

      const rates = sanitizeRates(payload?.rates);
      if (Object.keys(rates).length === 0) return;

      const snapshot = {
        base: BASE_CURRENCY,
        date: payload?.date ?? null,
        rates,
        fetchedAt: payload?.fetchedAt ?? new Date().toISOString(),
      };
      set({
        rates,
        date: snapshot.date,
        fetchedAt: snapshot.fetchedAt,
      });
      await saveStorage(RATES_STORAGE_KEY, JSON.stringify(snapshot));
    } finally {
      set({ isLoading: false });
    }
  },
}));

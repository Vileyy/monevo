import * as SecureStore from "expo-secure-store";
import { apiClient } from "@/services/api/client";
import { sanitizeRates, useCurrencyStore } from "@/store/currency.store";

jest.mock("@/services/api/client", () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

const getMock = apiClient.get as jest.Mock;
const RATE_FEED_URL =
  "https://latest.currency-api.pages.dev/v1/currencies/vnd.json";

function feedResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(payload),
  } as Response;
}

describe("currency.store", () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchSpy = jest
      .spyOn(global, "fetch")
      .mockRejectedValue(new TypeError("offline"));
    useCurrencyStore.setState({
      rates: {},
      date: null,
      fetchedAt: null,
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("drops invalid, non-positive and base-currency rates", () => {
    const rates = sanitizeRates({
      usd: 0.00004,
      EUR: 0,
      JPY: -1,
      VND: 1,
      AUD: "nope",
    });

    expect(rates).toEqual({ USD: 0.00004 });
  });

  it("restores rates from the persisted cache", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({
        base: "VND",
        date: "2026-10-25",
        rates: { USD: 0.00004 },
        fetchedAt: "2026-10-25T00:00:00.000Z",
      }),
    );

    await useCurrencyStore.getState().restoreRates();

    const state = useCurrencyStore.getState();
    expect(state.rates).toEqual({ USD: 0.00004 });
    expect(state.date).toBe("2026-10-25");
    expect(state.fetchedAt).toBe("2026-10-25T00:00:00.000Z");
  });

  it("ignores a corrupt cache entry", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce("not-json");

    await useCurrencyStore.getState().restoreRates();

    expect(useCurrencyStore.getState().rates).toEqual({});
  });

  it("refreshes and persists rates from the API", async () => {
    getMock.mockResolvedValueOnce({
      data: {
        base: "VND",
        date: "2026-10-25",
        rates: { USD: 0.00004, EUR: 0.000036 },
        fetchedAt: "2026-10-25T10:00:00.000Z",
      },
    });

    await useCurrencyStore.getState().refreshRates();

    expect(getMock).toHaveBeenCalledWith("/currency/rates");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(useCurrencyStore.getState().rates).toEqual({
      USD: 0.00004,
      EUR: 0.000036,
    });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "monevo_currency_rates",
      expect.stringContaining('"USD":0.00004'),
    );
  });

  it("falls back to the public feed when the API has no rates endpoint", async () => {
    getMock.mockRejectedValueOnce(
      Object.assign(new Error("Not Found"), {
        response: { status: 404 },
      }),
    );
    fetchSpy.mockResolvedValueOnce(
      feedResponse({
        date: "2026-10-25",
        vnd: { usd: 0.00004, jpy: 0.006, xyz: 9 },
      }),
    );

    await useCurrencyStore.getState().refreshRates();

    expect(fetchSpy).toHaveBeenCalledWith(
      RATE_FEED_URL,
      expect.objectContaining({ signal: expect.anything() }),
    );
    expect(useCurrencyStore.getState().rates).toEqual({
      USD: 0.00004,
      JPY: 0.006,
    });
    expect(SecureStore.setItemAsync).toHaveBeenCalled();
  });

  it("falls back to the public feed when the API returns no usable rates", async () => {
    getMock.mockResolvedValueOnce({ data: { rates: { VND: 1 } } });
    fetchSpy.mockResolvedValueOnce(
      feedResponse({ vnd: { usd: 0.00004 } }),
    );

    await useCurrencyStore.getState().refreshRates();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(useCurrencyStore.getState().rates).toEqual({ USD: 0.00004 });
  });

  it("keeps the previous rates when the request fails", async () => {
    useCurrencyStore.setState({ rates: { USD: 0.00004 } });
    getMock.mockRejectedValueOnce(new Error("offline"));

    await useCurrencyStore.getState().refreshRates();

    expect(useCurrencyStore.getState().rates).toEqual({ USD: 0.00004 });
    expect(useCurrencyStore.getState().isLoading).toBe(false);
  });
});

export type LegalPage = "privacy" | "terms" | "account-deletion";

export const LEGAL_PAGE_PATHS: Record<LegalPage, string> = {
  privacy: "/legal/privacy",
  terms: "/legal/terms",
  "account-deletion": "/legal/account-deletion",
};

/**
 * Build the public URL for a legal page hosted by the API.
 * Returns null when EXPO_PUBLIC_API_URL is missing so callers can show a
 * useful message instead of opening a relative URL.
 */
export function legalPageUrl(
  page: LegalPage,
  baseUrl: string | undefined = process.env.EXPO_PUBLIC_API_URL,
): string | null {
  const base = (baseUrl ?? "").trim().replace(/\/+$/, "");
  if (!base) return null;
  return `${base}${LEGAL_PAGE_PATHS[page]}`;
}

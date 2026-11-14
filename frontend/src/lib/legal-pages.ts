export type LegalPage = 'privacy' | 'terms' | 'account-deletion';

/**
 * Public legal site, served by the API at `/legal/*`.
 * Kept independent from EXPO_PUBLIC_API_URL so the links never break when the
 * API host or IP changes.
 */
export const DEFAULT_LEGAL_BASE_URL = 'https://api.monevoapp.me';

export const LEGAL_PAGE_PATHS: Record<LegalPage, string> = {
  privacy: '/legal/privacy',
  terms: '/legal/terms',
  'account-deletion': '/legal/account-deletion',
};

/**
 * Build the public URL for a legal page.
 * Returns null when an explicit base is blank so callers can show a useful
 * message instead of opening a relative URL.
 */
export function legalPageUrl(
  page: LegalPage,
  baseUrl: string | null = process.env.EXPO_PUBLIC_LEGAL_BASE_URL ??
    DEFAULT_LEGAL_BASE_URL,
): string | null {
  const base = (baseUrl ?? '').trim().replace(/\/+$/, '');
  if (!base) return null;
  return `${base}${LEGAL_PAGE_PATHS[page]}`;
}

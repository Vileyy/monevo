import {
  LegalPageOptions,
  renderAccountDeletion,
  renderLegalIndex,
  renderPrivacyPolicy,
  renderTermsOfService,
} from '../../src/legal/legal.content';

const OPTIONS: LegalPageOptions = {
  appName: 'Monevo',
  operatorName: 'Doan Quoc Hieu',
  contactEmail: 'privacy@example.com',
  country: 'Vietnam',
  lastUpdated: '2026-10-25',
  basePath: '/monevo',
  canonicalBase: 'https://vileyy.github.io/monevo',
};

function ids(html: string, pattern: RegExp): string[] {
  return Array.from(html.matchAll(pattern), (match) => match[1]);
}

describe('legal content', () => {
  it('renders a self-contained, indexable document for each page', () => {
    for (const html of [
      renderPrivacyPolicy(OPTIONS),
      renderTermsOfService(OPTIONS),
      renderAccountDeletion(OPTIONS),
    ]) {
      expect(html).toMatch(/^<!doctype html>/);
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('<meta name="robots" content="index, follow" />');
      expect(html).toContain('Content-Security-Policy');
      expect(html).toContain('class="skip-link"');
      expect(html.match(/<h1>/g)).toHaveLength(1);
      expect(html).not.toContain('<script');
    }
  });

  it('publishes canonical URLs only when a canonical base is configured', () => {
    expect(renderPrivacyPolicy(OPTIONS)).toContain(
      '<link rel="canonical" href="https://vileyy.github.io/monevo/legal/privacy/" />',
    );

    const withoutCanonical: LegalPageOptions = { ...OPTIONS };
    delete withoutCanonical.canonicalBase;
    expect(renderPrivacyPolicy(withoutCanonical)).not.toContain(
      'rel="canonical"',
    );
  });

  it('builds a table of contents that matches the section ids', () => {
    const html = renderPrivacyPolicy(OPTIONS);
    const sectionIds = ids(html, /<h2 id="([^"]+)">/g);
    const aside = html.slice(html.indexOf('<aside'), html.indexOf('</aside>'));
    const tocTargets = ids(aside, /href="#([^"]+)"/g);

    expect(sectionIds.length).toBeGreaterThan(5);
    expect(new Set(tocTargets)).toEqual(new Set(sectionIds));
  });

  it('formats the last updated date for humans', () => {
    expect(renderPrivacyPolicy(OPTIONS)).toContain(
      'Last updated 25 October 2026',
    );
  });

  it('covers the Google API Services Limited Use requirements', () => {
    const html = renderPrivacyPolicy(OPTIONS);

    expect(html).toContain('Google API Services User Data Policy');
    expect(html).toContain('Limited Use requirements');
    expect(html).toContain(
      'https://developers.google.com/terms/api-services-user-data-policy',
    );
    expect(html).toContain('We do not use Google user data');
  });

  it('lists every processor with its purpose and processing location', () => {
    const html = renderPrivacyPolicy(OPTIONS);

    for (const provider of [
      'Clerk',
      'Google',
      'Amazon Web Services',
      'Expo',
      'PostHog',
      'Sentry',
    ]) {
      expect(html).toContain(provider);
    }
    expect(html).toContain('Processing location');
    expect(html).toContain('ap-southeast-2');
  });

  it('states retention periods for each data category', () => {
    const html = renderPrivacyPolicy(OPTIONS);

    expect(html).toContain('Up to 12 months.');
    expect(html).toContain('Up to 90 days.');
    expect(html).toContain('within 30 days');
  });

  it('keeps the terms free of obsolete sign-in language', () => {
    const html = renderTermsOfService(OPTIONS);

    expect(html).toContain('not a bank');
    expect(html).toContain('laws of Vietnam');
    expect(html).toContain('Fees');
    expect(html).not.toContain('verification codes');
    expect(html).toContain('/monevo/legal/privacy');
  });

  it('explains account deletion, retention and Google access removal', () => {
    const html = renderAccountDeletion(OPTIONS);

    expect(html).toContain('Delete your account');
    expect(html).toContain('Profile');
    expect(html).toContain('Account%20deletion%20request');
    expect(html).toContain('https://myaccount.google.com/permissions');
    expect(html).toContain('within 30 days');
  });

  it('escapes configured values before embedding them', () => {
    const html = renderPrivacyPolicy({
      ...OPTIONS,
      operatorName: '<script>alert(1)</script>',
      contactEmail: '"onmouseover="alert(1)',
    });

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('"onmouseover="');
  });

  it('renders a legal landing page with all three destinations', () => {
    const html = renderLegalIndex(OPTIONS);

    expect(html).toContain('<title>Monevo · Legal</title>');
    expect(html).toContain('href="/monevo/legal/privacy"');
    expect(html).toContain('href="/monevo/legal/terms"');
    expect(html).toContain('href="/monevo/legal/account-deletion"');
    expect(html).toContain(
      '<link rel="canonical" href="https://vileyy.github.io/monevo/" />',
    );
    expect(html).not.toContain('<script');
  });
});

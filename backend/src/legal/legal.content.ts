export interface LegalPageOptions {
  appName: string;
  operatorName: string;
  contactEmail: string;
  country: string;
  lastUpdated: string;
  /** Prefix for internal links, e.g. "/monevo" on GitHub Pages. */
  basePath?: string;
  /** Absolute site origin used for canonical links, e.g. GitHub Pages. */
  canonicalBase?: string;
}

export const DEFAULT_LEGAL_OPTIONS: Omit<
  LegalPageOptions,
  'basePath' | 'canonicalBase'
> = {
  appName: 'Monevo',
  operatorName: 'Doan Quoc Hieu',
  contactEmail: 'doanquochieu2104@gmail.com',
  country: 'Vietnam',
  lastUpdated: '2026-10-25',
};

interface LegalSection {
  id: string;
  title: string;
  body: string;
}

type LegalPageKey = 'privacy' | 'terms' | 'account-deletion';

const PAGE_PATHS: Record<LegalPageKey, string> = {
  privacy: '/legal/privacy/',
  terms: '/legal/terms/',
  'account-deletion': '/legal/account-deletion/',
};

const PROVIDERS = [
  {
    name: 'Clerk',
    href: 'https://clerk.com/legal/privacy',
    purpose: 'Authentication and session management.',
    location: 'United States',
  },
  {
    name: 'Google',
    href: 'https://policies.google.com/privacy',
    purpose: 'Sign-in with Google, only if you choose it.',
    location: 'United States',
  },
  {
    name: 'Amazon Web Services (AWS)',
    href: 'https://aws.amazon.com/privacy/',
    purpose: 'Hosting for the API and PostgreSQL database.',
    location: 'Australia (ap-southeast-2)',
  },
  {
    name: 'Expo',
    href: 'https://expo.dev/privacy',
    purpose: 'Application build and distribution tooling.',
    location: 'United States',
  },
  {
    name: 'PostHog',
    href: 'https://posthog.com/privacy',
    purpose: 'Product analytics for screens and actions.',
    location: 'United States',
  },
  {
    name: 'Sentry',
    href: 'https://sentry.io/privacy/',
    purpose: 'Error monitoring and diagnostics.',
    location: 'United States',
  },
];

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%231F6B4A'/%3E%3Cpath d='M18 46V18h6l8 11 8-11h6v28h-6V29l-8 11-8-11v17z' fill='%23F4F1EA'/%3E%3C/svg%3E";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDisplayDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const [, year, month, day] = match;
  const monthName = MONTHS[Number(month) - 1];
  if (!monthName) return iso;
  return `${Number(day)} ${monthName} ${year}`;
}

const SITE_STYLES = `
      :root {
        color-scheme: light dark;
        --bg: #f4f1ea;
        --surface: #fbfaf6;
        --surface-raised: #ffffff;
        --ink: #1a1a17;
        --muted: #5f5d56;
        --line: #ded9cc;
        --accent: #1f6b4a;
        --accent-soft: #e4f0e9;
        --code-bg: #efebe1;
        --radius: 14px;
        --measure: 68ch;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --bg: #121311;
          --surface: #191a17;
          --surface-raised: #20221e;
          --ink: #eeebe4;
          --muted: #a6a396;
          --line: #2d2f2a;
          --accent: #8fd3b2;
          --accent-soft: #1d2a23;
          --code-bg: #23251f;
        }
      }
      * { box-sizing: border-box; }
      html {
        scroll-behavior: smooth;
        -webkit-text-size-adjust: 100%;
      }
      @media (prefers-reduced-motion: reduce) {
        html { scroll-behavior: auto; }
      }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--ink);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          "Helvetica Neue", Arial, sans-serif;
        font-size: 16px;
        line-height: 1.7;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
      }
      ::selection { background: var(--accent-soft); color: var(--ink); }
      a {
        color: var(--accent);
        text-decoration: underline;
        text-decoration-thickness: 1px;
        text-underline-offset: 2px;
      }
      a:hover { text-decoration-thickness: 2px; }
      :focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 3px;
        border-radius: 3px;
      }
      .skip-link {
        position: absolute;
        left: 16px;
        top: -48px;
        z-index: 10;
        padding: 10px 14px;
        background: var(--surface-raised);
        border: 1px solid var(--line);
        border-radius: 8px;
        font-size: 14px;
      }
      .skip-link:focus { top: 12px; }
      .site-header {
        border-bottom: 1px solid var(--line);
        background: var(--bg);
        position: sticky;
        top: 0;
        z-index: 5;
      }
      .header-inner {
        max-width: 1120px;
        margin: 0 auto;
        padding: 0 32px;
        min-height: 68px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        flex-wrap: wrap;
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        color: var(--ink);
        text-decoration: none;
        font-weight: 650;
        letter-spacing: -0.01em;
      }
      .brand-mark {
        width: 26px;
        height: 26px;
        border-radius: 7px;
        background: var(--accent);
        color: var(--bg);
        display: inline-grid;
        place-items: center;
        font-size: 14px;
        font-weight: 700;
      }
      .brand-sub {
        color: var(--muted);
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 0.02em;
        padding-left: 10px;
        border-left: 1px solid var(--line);
      }
      .page-nav {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }
      .page-nav a {
        color: var(--muted);
        text-decoration: none;
        font-size: 14px;
        font-weight: 550;
        padding: 8px 12px;
        border-radius: 8px;
      }
      .page-nav a:hover { color: var(--ink); background: var(--accent-soft); }
      .page-nav a[aria-current="page"] {
        color: var(--accent);
        background: var(--accent-soft);
      }
      .layout {
        max-width: 1120px;
        margin: 0 auto;
        padding: 56px 32px 88px;
        display: grid;
        grid-template-columns: 232px minmax(0, 1fr);
        gap: 72px;
        align-items: start;
      }
      .toc {
        position: sticky;
        top: 96px;
        max-height: calc(100vh - 128px);
        overflow-y: auto;
        font-size: 13.5px;
        line-height: 1.45;
      }
      .toc-title {
        margin: 0 0 12px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--muted);
      }
      .toc ol {
        list-style: none;
        margin: 0;
        padding: 0;
        border-left: 1px solid var(--line);
      }
      .toc li { margin: 0; }
      .toc a {
        display: block;
        padding: 6px 0 6px 14px;
        color: var(--muted);
        text-decoration: none;
        border-left: 2px solid transparent;
        margin-left: -1.5px;
      }
      .toc a:hover { color: var(--ink); border-left-color: var(--line); }
      .toc a[aria-current="true"] {
        color: var(--accent);
        border-left-color: var(--accent);
        font-weight: 600;
      }
      .toc-mobile { display: none; }
      .document { min-width: 0; max-width: 760px; }
      .doc-header { margin-bottom: 36px; }
      .eyebrow {
        margin: 0 0 14px;
        font-size: 11.5px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--accent);
      }
      h1 {
        margin: 0 0 14px;
        font-size: clamp(2.1rem, 4.4vw, 2.9rem);
        line-height: 1.08;
        letter-spacing: -0.03em;
        font-weight: 680;
      }
      .lede {
        margin: 0 0 18px;
        font-size: 1.06rem;
        color: var(--muted);
        max-width: var(--measure);
      }
      .meta {
        margin: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 8px 14px;
        font-size: 13px;
        color: var(--muted);
      }
      .meta span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .meta span::before {
        content: "";
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: var(--accent);
      }
      .meta span:first-child::before { display: none; }
      .glance {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1px;
        background: var(--line);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        overflow: hidden;
        margin: 0 0 44px;
      }
      .glance-item {
        background: var(--surface);
        padding: 18px 20px;
      }
      .glance-label {
        display: block;
        margin-bottom: 4px;
        font-size: 11.5px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--accent);
      }
      .glance-text {
        margin: 0;
        font-size: 14.5px;
        line-height: 1.55;
        color: var(--ink);
      }
      section {
        scroll-margin-top: 92px;
        padding-top: 30px;
        margin-top: 30px;
        border-top: 1px solid var(--line);
      }
      section:first-of-type { border-top: 0; margin-top: 0; padding-top: 0; }
      h2 {
        position: relative;
        margin: 0 0 14px;
        font-size: 1.34rem;
        line-height: 1.3;
        letter-spacing: -0.015em;
        font-weight: 650;
      }
      h2 .anchor {
        position: absolute;
        left: -1.15em;
        width: 1.15em;
        color: var(--muted);
        text-decoration: none;
        opacity: 0;
        font-weight: 500;
      }
      h2:hover .anchor,
      h2 .anchor:focus-visible { opacity: 1; }
      h3 {
        margin: 26px 0 8px;
        font-size: 1.02rem;
        font-weight: 650;
        letter-spacing: -0.01em;
      }
      p { margin: 0 0 14px; max-width: var(--measure); color: var(--ink); }
      .muted { color: var(--muted); }
      ul, ol {
        margin: 0 0 16px;
        padding-left: 22px;
        max-width: var(--measure);
      }
      li { margin: 6px 0; }
      li::marker { color: var(--muted); }
      strong { font-weight: 650; }
      .notice {
        margin: 22px 0;
        padding: 18px 20px;
        background: var(--accent-soft);
        border-left: 3px solid var(--accent);
        border-radius: 0 10px 10px 0;
        font-size: 15px;
        max-width: var(--measure);
      }
      .notice p { margin: 0; }
      .table-wrap {
        margin: 20px 0 26px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: var(--surface);
        overflow-x: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14.5px;
        line-height: 1.55;
      }
      th, td {
        padding: 12px 16px;
        text-align: left;
        vertical-align: top;
        border-bottom: 1px solid var(--line);
      }
      th {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.09em;
        text-transform: uppercase;
        color: var(--muted);
        background: var(--surface-raised);
        white-space: nowrap;
      }
      tbody tr:last-child td { border-bottom: 0; }
      td { color: var(--ink); }
      .toc-mobile {
        margin: 0 0 28px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: var(--surface);
        padding: 0 18px;
      }
      .toc-mobile summary {
        cursor: pointer;
        padding: 14px 0;
        font-size: 13px;
        font-weight: 650;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--muted);
      }
      .toc-mobile ol { margin: 0 0 14px; font-size: 14px; }
      .doc-footer {
        margin-top: 56px;
        padding-top: 24px;
        border-top: 1px solid var(--line);
        font-size: 14px;
        color: var(--muted);
      }
      .doc-footer p { color: var(--muted); margin: 0 0 6px; }
      .fine { font-size: 13px; }
      .site-footer {
        border-top: 1px solid var(--line);
        background: var(--surface);
      }
      .footer-inner {
        max-width: 1120px;
        margin: 0 auto;
        padding: 28px 32px 36px;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        font-size: 13px;
        color: var(--muted);
      }
      .footer-inner nav { display: flex; gap: 16px; flex-wrap: wrap; }
      .footer-inner a { color: var(--muted); text-decoration: none; }
      .footer-inner a:hover { color: var(--ink); text-decoration: underline; }
      @media (max-width: 900px) {
        .layout {
          grid-template-columns: minmax(0, 1fr);
          gap: 0;
          padding: 32px 20px 64px;
        }
        .toc { display: none; }
        .toc-mobile { display: block; }
        .header-inner {
          padding: 0 20px;
          min-height: 56px;
          gap: 8px;
          flex-wrap: nowrap;
        }
        .page-nav { gap: 2px; }
        .page-nav a { padding: 7px 9px; font-size: 13.5px; }
        .brand-sub { display: none; }
        .glance { grid-template-columns: minmax(0, 1fr); }
        h2 .anchor { display: none; }
        .footer-inner { padding: 24px 20px 32px; }
      }
      @media (max-width: 620px) {
        .brand-name { display: none; }
        .header-inner { padding: 0 16px; }
        .page-nav a { padding: 7px 8px; font-size: 13px; }
        .meta { flex-direction: column; gap: 2px; }
        .meta span::before { display: none; }
      }
      @media print {
        :root {
          --bg: #fff;
          --surface: #fff;
          --surface-raised: #fff;
          --ink: #000;
          --muted: #333;
          --line: #ccc;
          --accent: #000;
          --accent-soft: #fff;
        }
        .site-header, .site-footer, .toc, .toc-mobile, .skip-link { display: none; }
        .layout {
          display: block;
          max-width: none;
          padding: 0;
          margin: 0;
        }
        .document { max-width: none; }
        a { color: #000; }
        section { break-inside: avoid; }
        .glance { break-inside: avoid; }
      }
`;

const INDEX_STYLES = `
      :root {
        color-scheme: light dark;
        --bg: #f4f1ea;
        --surface: #fbfaf6;
        --ink: #1a1a17;
        --muted: #5f5d56;
        --line: #ded9cc;
        --accent: #1f6b4a;
        --accent-soft: #e4f0e9;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --bg: #121311;
          --surface: #191a17;
          --ink: #eeebe4;
          --muted: #a6a396;
          --line: #2d2f2a;
          --accent: #8fd3b2;
          --accent-soft: #1d2a23;
        }
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        background: var(--bg);
        color: var(--ink);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          "Helvetica Neue", Arial, sans-serif;
        line-height: 1.65;
        -webkit-font-smoothing: antialiased;
      }
      a { color: var(--accent); }
      :focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
      .wrap {
        max-width: 920px;
        margin: 0 auto;
        padding: 72px 32px 56px;
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 48px;
        color: var(--ink);
        text-decoration: none;
        font-weight: 650;
        letter-spacing: -0.01em;
      }
      .brand-mark {
        width: 26px;
        height: 26px;
        border-radius: 7px;
        background: var(--accent);
        color: var(--bg);
        display: inline-grid;
        place-items: center;
        font-size: 14px;
        font-weight: 700;
      }
      .eyebrow {
        margin: 0 0 12px;
        font-size: 11.5px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--accent);
      }
      h1 {
        margin: 0 0 14px;
        font-size: clamp(2.2rem, 5vw, 3.1rem);
        line-height: 1.05;
        letter-spacing: -0.035em;
        font-weight: 680;
      }
      .lede {
        margin: 0 0 40px;
        max-width: 56ch;
        color: var(--muted);
        font-size: 1.05rem;
      }
      .cards { display: grid; gap: 12px; }
      .card {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 20px;
        padding: 22px 24px;
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 14px;
        color: var(--ink);
        text-decoration: none;
        transition: border-color 120ms ease, transform 120ms ease;
      }
      .card:hover {
        border-color: var(--accent);
        transform: translateY(-1px);
      }
      .card-kicker {
        display: block;
        margin-bottom: 4px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--accent);
      }
      .card-title {
        display: block;
        font-size: 1.08rem;
        font-weight: 650;
      }
      .card-text {
        display: block;
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 14.5px;
      }
      .card-arrow { color: var(--muted); font-size: 18px; }
      .card:hover .card-arrow { color: var(--accent); }
      footer {
        margin-top: 48px;
        padding-top: 20px;
        border-top: 1px solid var(--line);
        font-size: 13px;
        color: var(--muted);
      }
      @media (prefers-reduced-motion: reduce) {
        .card { transition: none; }
        .card:hover { transform: none; }
      }
      @media (max-width: 560px) {
        .wrap { padding: 44px 20px 40px; }
        .brand { margin-bottom: 36px; }
        .card { padding: 18px 18px; }
      }
`;

function renderNav(options: LegalPageOptions, active?: LegalPageKey): string {
  const base = escapeHtml(options.basePath ?? '');
  const links: Array<[LegalPageKey, string]> = [
    ['privacy', 'Privacy'],
    ['terms', 'Terms'],
    ['account-deletion', 'Delete account'],
  ];
  return links
    .map(([key, label]) => {
      const current = active === key ? ' aria-current="page"' : '';
      return `<a href="${base}/legal/${key}"${current}>${label}</a>`;
    })
    .join('\n          ');
}

function renderTocList(sections: LegalSection[]): string {
  return sections
    .map(
      (section) =>
        `<li><a href="#${section.id}">${escapeHtml(section.title)}</a></li>`,
    )
    .join('\n            ');
}

function renderSections(sections: LegalSection[]): string {
  return sections
    .map(
      (section) => `
        <section aria-labelledby="${section.id}">
          <h2 id="${section.id}">
            <a class="anchor" href="#${section.id}" aria-label="Permalink to ${escapeHtml(section.title)}">#</a>${escapeHtml(section.title)}
          </h2>
          ${section.body.trim()}
        </section>`,
    )
    .join('\n');
}

interface PageDocument {
  title: string;
  description: string;
  key: LegalPageKey;
  intro: string;
  glance: Array<[string, string]>;
  sections: LegalSection[];
}

function layout(document: PageDocument, options: LegalPageOptions): string {
  const appName = escapeHtml(options.appName);
  const operatorName = escapeHtml(options.operatorName);
  const contactEmail = escapeHtml(options.contactEmail);
  const country = escapeHtml(options.country);
  const lastUpdated = formatDisplayDate(options.lastUpdated);
  const base = escapeHtml(options.basePath ?? '');
  const canonical = options.canonicalBase
    ? `<link rel="canonical" href="${escapeHtml(options.canonicalBase)}${PAGE_PATHS[document.key]}" />`
    : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${escapeHtml(document.description)}" />
    <meta name="robots" content="index, follow" />
    <meta name="theme-color" content="#f4f1ea" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#121311" media="(prefers-color-scheme: dark)" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'" />
    ${canonical}
    <link rel="icon" href="${FAVICON}" />
    <title>${escapeHtml(document.title)} · ${appName}</title>
    <style>${SITE_STYLES}</style>
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header">
      <div class="header-inner">
        <a class="brand" href="${base}/">
          <span class="brand-mark" aria-hidden="true">M</span>
          <span class="brand-name">${appName}</span>
          <span class="brand-sub">Legal</span>
        </a>
        <nav class="page-nav" aria-label="Legal pages">
          ${renderNav(options, document.key)}
        </nav>
      </div>
    </header>
    <main id="main" class="layout">
      <aside class="toc" aria-label="On this page">
        <p class="toc-title">On this page</p>
        <ol>
            ${renderTocList(document.sections)}
        </ol>
      </aside>
      <article class="document">
        <details class="toc-mobile">
          <summary>On this page</summary>
          <ol>
            ${renderTocList(document.sections)}
          </ol>
        </details>
        <header class="doc-header">
          <p class="eyebrow">${appName} · Legal</p>
          <h1>${escapeHtml(document.title)}</h1>
          <p class="lede">${document.intro}</p>
          <p class="meta">
            <span>Last updated ${lastUpdated}</span>
            <span>Applies to the ${appName} app and API</span>
          </p>
        </header>
        <div class="glance">
          ${document.glance
            .map(
              ([label, text]) => `<div class="glance-item">
            <span class="glance-label">${label}</span>
            <p class="glance-text">${text}</p>
          </div>`,
            )
            .join('\n          ')}
        </div>
        ${renderSections(document.sections)}
        <footer class="doc-footer">
          <p>
            Questions about this page? Email
            <a href="mailto:${contactEmail}">${contactEmail}</a>.
          </p>
          <p class="fine">
            ${appName} is operated by ${operatorName} in ${country}.
          </p>
        </footer>
      </article>
    </main>
    <footer class="site-footer">
      <div class="footer-inner">
        <span>© ${new Date().getUTCFullYear()} ${appName}. All rights reserved.</span>
        <nav aria-label="Legal">
          <a href="${base}/legal/privacy">Privacy Policy</a>
          <a href="${base}/legal/terms">Terms of Service</a>
          <a href="${base}/legal/account-deletion">Delete account</a>
        </nav>
      </div>
    </footer>
  </body>
</html>`;
}

const PROVIDER_ROWS = PROVIDERS.map(
  (provider) => `
            <tr>
              <td><a href="${provider.href}" rel="noopener noreferrer">${provider.name}</a></td>
              <td>${provider.purpose}</td>
              <td>${provider.location}</td>
            </tr>`,
).join('');

export function renderPrivacyPolicy(options: LegalPageOptions): string {
  const appName = escapeHtml(options.appName);
  const operatorName = escapeHtml(options.operatorName);
  const contactEmail = escapeHtml(options.contactEmail);
  const country = escapeHtml(options.country);
  const base = escapeHtml(options.basePath ?? '');

  const sections: LegalSection[] = [
    {
      id: 'who-we-are',
      title: '1. Who we are',
      body: `
        <p>
          ${appName} is a personal finance app operated by ${operatorName}, an
          individual developer based in ${country}. For the purposes of data
          protection law, ${operatorName} is the data controller of the
          information described in this policy.
        </p>
        <p>
          This policy applies to the ${appName} mobile application and the API
          that serves it (together, the "Service"). For privacy questions or
          requests, email
          <a href="mailto:${contactEmail}">${contactEmail}</a>.
        </p>`,
    },
    {
      id: 'information-we-collect',
      title: '2. Information we collect',
      body: `
        <p>
          We collect only what is needed to run the Service. You can use much of
          the app without entering financial details, but an account is required
          to store your records.
        </p>

        <h3>Account information</h3>
        <ul>
          <li>Email address and display name.</li>
          <li>
            If you sign in with Google: the Google account email, name and
            profile photo that Google shares with us through our identity
            provider, Clerk.
          </li>
          <li>
            Authentication identifiers issued by Clerk and an internal user
            identifier used to link your records.
          </li>
          <li>
            If you set a password, it is stored only as a salted hash. We never
            store your password in readable form.
          </li>
        </ul>

        <h3>Financial records you enter</h3>
        <ul>
          <li>Wallet names, types and balances.</li>
          <li>Income and expense transactions, notes and dates.</li>
          <li>Categories, monthly budgets and bill reminders.</li>
        </ul>
        <p>
          This information is stored so the Service can show it back to you. We
          do not connect to your bank, we never receive your bank credentials or
          card numbers, and we do not move money.
        </p>

        <h3>Usage and analytics data</h3>
        <p>
          We use PostHog to understand how the app is used and to fix what is
          confusing. PostHog receives:
        </p>
        <ul>
          <li>
            App events such as screens opened and actions you take. The
            analytics SDK records these automatically.
          </li>
          <li>
            Technical details attached to each event, such as app version,
            device model, operating system version and language.
          </li>
          <li>An approximate region derived from your IP address.</li>
          <li>
            Your internal user identifier while you are signed in, so we can tell
            a returning user from a new one.
          </li>
        </ul>
        <p>
          We do not send your email address, your name, your transaction
          amounts, your notes or your budgets to PostHog.
        </p>

        <h3>Diagnostics and error data</h3>
        <p>
          When the app or API fails, Sentry receives the error message, a stack
          trace and technical request details such as the route, status code,
          timing and app version. We do not intentionally include your financial
          records in these reports.
        </p>

        <h3>Notifications</h3>
        <p>
          Bill reminders are scheduled locally on your device and their content
          is not sent to our servers. We only learn whether you granted the
          notification permission.
        </p>

        <div class="notice">
          <p>
            We do not collect precise location, contacts, photos, microphone,
            health data or advertising identifiers. We do not use advertising
            SDKs and we do not sell personal data.
          </p>
        </div>`,
    },
    {
      id: 'how-we-use',
      title: '3. How we use information',
      body: `
        <ul>
          <li>To create and secure your account and sign you in.</li>
          <li>To store and display the financial records you enter.</li>
          <li>To schedule bill reminder notifications you enable.</li>
          <li>To understand which features are used and improve the Service.</li>
          <li>To detect, diagnose and fix errors and abuse.</li>
          <li>To respond to support and privacy requests.</li>
        </ul>
        <p>
          We do not use your information for advertising, profiling with legal
          effects, or automated decisions that affect your rights.
        </p>`,
    },
    {
      id: 'legal-bases',
      title: '4. Legal bases',
      body: `
        <p>
          Where data protection law requires a legal basis, we rely on:
        </p>
        <ul>
          <li>
            <strong>Performance of a contract</strong> — to provide the Service
            you signed up for.
          </li>
          <li>
            <strong>Consent</strong> — for notifications, which you can withdraw
            at any time.
          </li>
          <li>
            <strong>Legitimate interests</strong> — to keep the Service secure,
            prevent abuse, fix errors and understand which features are used.
          </li>
          <li>
            <strong>Legal obligation</strong> — where we must retain or disclose
            information by law.
          </li>
        </ul>`,
    },
    {
      id: 'sharing',
      title: '5. Sharing and service providers',
      body: `
        <p>
          We share information only with providers that help us run the Service.
          They process it on our behalf and are not permitted to use it for their
          own advertising.
        </p>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Provider</th>
                <th scope="col">Purpose</th>
                <th scope="col">Processing location</th>
              </tr>
            </thead>
            <tbody>${PROVIDER_ROWS}
            </tbody>
          </table>
        </div>
        <h3>Google user data</h3>
        <p>
          If you sign in with Google, we use your basic profile information
          (name, email address and profile photo) only to create and display
          your account. Our use of information received from Google APIs adheres
          to the
          <a href="https://developers.google.com/terms/api-services-user-data-policy" rel="noopener noreferrer">Google API Services User Data Policy</a>,
          including the Limited Use requirements. We do not use Google user data
          for advertising, and we do not transfer it to third parties except as
          needed to provide the Service, to comply with law, or with your
          consent.
        </p>
        <p>
          We may also disclose information when required by law, to respond to
          lawful requests, or to protect the rights, property or safety of our
          users and the Service.
        </p>`,
    },
    {
      id: 'storage-security-retention',
      title: '6. Storage, security and retention',
      body: `
        <p>
          Account and financial records are stored in our PostgreSQL database on
          AWS. Google sign-in credentials are handled by Clerk, and email and
          password sign-in is handled by our API; passwords are stored only as
          salted hashes. Server access is restricted to authorized operators,
          and authentication tokens on your device are kept in the platform
          secure store. Our public pages, including this one, are served over
          HTTPS.
        </p>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Data</th>
                <th scope="col">Retention</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Account and financial records</td>
                <td>While your account exists. Deleted when you delete your account.</td>
              </tr>
              <tr>
                <td>Encrypted database backups</td>
                <td>Overwritten within 30 days.</td>
              </tr>
              <tr>
                <td>Product analytics events</td>
                <td>Up to 12 months.</td>
              </tr>
              <tr>
                <td>Error diagnostics</td>
                <td>Up to 90 days.</td>
              </tr>
              <tr>
                <td>Records required by law</td>
                <td>Only for as long as the law requires.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          No method of transmission or storage is completely secure. We work to
          protect your information, but we cannot guarantee absolute security.
        </p>`,
    },
    {
      id: 'your-rights',
      title: '7. Your rights and choices',
      body: `
        <p>Depending on your location, you may have the right to:</p>
        <ul>
          <li>Access and receive a copy of your information.</li>
          <li>Correct inaccurate account information.</li>
          <li>Delete your account and associated data.</li>
          <li>Withdraw consent, for example by disabling notifications.</li>
          <li>Opt out of product analytics.</li>
          <li>Object to or restrict certain processing.</li>
          <li>Complain to your local data protection authority.</li>
        </ul>
        <p>
          You can delete your account directly in the app: Profile → Delete
          Account. You can also use our
          <a href="${base}/legal/account-deletion">account deletion page</a> or
          email <a href="mailto:${contactEmail}">${contactEmail}</a> to exercise
          any of these rights, including requesting a copy of your data or
          opting out of analytics. We respond to verified requests within 30
          days.
        </p>`,
    },
    {
      id: 'children',
      title: '8. Children',
      body: `
        <p>
          The Service is not directed to children under 13 (or the minimum age in
          your country). We do not knowingly collect data from children. If you
          believe a child has created an account, contact us and we will delete
          it.
        </p>`,
    },
    {
      id: 'international-transfers',
      title: '9. International transfers',
      body: `
        <p>
          Our providers may process information in countries other than yours,
          including the United States and Australia. Where required, we rely on
          appropriate safeguards for those transfers, such as standard
          contractual clauses.
        </p>`,
    },
    {
      id: 'changes',
      title: '10. Changes',
      body: `
        <p>
          We may update this Privacy Policy. If we make material changes, we will
          update the date at the top of this page and, where appropriate, notify
          you in the app before the change takes effect.
        </p>`,
    },
    {
      id: 'contact',
      title: '11. Contact',
      body: `
        <p>
          ${operatorName}, ${country} —
          <a href="mailto:${contactEmail}">${contactEmail}</a>. We aim to respond
          to privacy questions within 30 days.
        </p>`,
    },
  ];

  return layout(
    {
      title: 'Privacy Policy',
      description: `How ${appName} collects, uses, shares and deletes your information.`,
      key: 'privacy',
      intro: `This policy explains what ${appName} collects, why we need it, who
        processes it, and how you can delete it — in plain language.`,
      glance: [
        [
          'What we collect',
          'Account details and the financial records you enter.',
        ],
        [
          'What we never collect',
          'Bank credentials, card numbers, contacts, photos or advertising IDs.',
        ],
        ['Who processes it', 'Clerk, Google, AWS, Expo, PostHog and Sentry.'],
        [
          'How to delete',
          'In the app via Profile → Delete Account, or by email.',
        ],
      ],
      sections,
    },
    options,
  );
}

export function renderTermsOfService(options: LegalPageOptions): string {
  const appName = escapeHtml(options.appName);
  const operatorName = escapeHtml(options.operatorName);
  const contactEmail = escapeHtml(options.contactEmail);
  const country = escapeHtml(options.country);
  const base = escapeHtml(options.basePath ?? '');

  const sections: LegalSection[] = [
    {
      id: 'the-service',
      title: '1. The Service',
      body: `
        <p>
          These Terms of Service ("Terms") govern your use of the ${appName}
          mobile application and API (the "Service"), operated by
          ${operatorName} ("we", "us", "our"). By creating an account or using
          the Service, you agree to these Terms.
        </p>
        <p>
          ${appName} is a personal bookkeeping tool that lets you record wallets,
          transactions, budgets and bill reminders, and view summaries based on
          the information you enter.
        </p>
        <div class="notice">
          <p>
            ${appName} is not a bank, payment service or licensed financial
            adviser. Balances and insights are calculated only from the
            information you enter and may be incomplete or inaccurate. Nothing in
            the Service is financial, tax, legal or investment advice.
          </p>
        </div>`,
    },
    {
      id: 'accounts',
      title: '2. Accounts',
      body: `
        <ul>
          <li>You must provide accurate account information.</li>
          <li>
            You are responsible for keeping access to your email account and
            your Google account secure. Do not share your account or sign-in
            credentials with anyone.
          </li>
          <li>
            You must be at least 13 years old (or the minimum age in your
            country).
          </li>
          <li>One person or organization per account.</li>
        </ul>`,
    },
    {
      id: 'acceptable-use',
      title: '3. Acceptable use',
      body: `
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for unlawful, fraudulent or abusive activity.</li>
          <li>Attempt to access other users' data or bypass authentication.</li>
          <li>Probe, scan or disrupt the Service or its infrastructure.</li>
          <li>
            Reverse engineer or copy the Service except as permitted by law.
          </li>
        </ul>`,
    },
    {
      id: 'your-content',
      title: '4. Your content',
      body: `
        <p>
          You keep ownership of the records you enter. You grant us a limited
          license to store, process and display that content solely to operate
          the Service for you. We do not use your financial records for
          advertising or sell them.
        </p>`,
    },
    {
      id: 'fees',
      title: '5. Fees',
      body: `
        <p>
          The core Service is currently free. If we introduce paid features, we
          will show the price and terms before you are charged, and you will be
          able to choose whether to use them. Store billing terms may also apply.
        </p>`,
    },
    {
      id: 'third-party-services',
      title: '6. Third-party services',
      body: `
        <p>
          Sign-in is provided by Clerk and, if you choose it, Google. App
          distribution and updates may involve Expo and the Google Play Store.
          Your use of those services is also subject to their own terms and
          privacy policies. We are not responsible for third-party services we do
          not control.
        </p>`,
    },
    {
      id: 'availability',
      title: '7. Availability and changes',
      body: `
        <p>
          We aim to keep the Service available, but it is provided on an "as is"
          and "as available" basis. We may change, suspend or discontinue
          features and will make reasonable efforts to give notice of material
          changes. Keep your own records of anything you cannot afford to lose.
        </p>`,
    },
    {
      id: 'limitation-of-liability',
      title: '8. Limitation of liability',
      body: `
        <p>
          To the maximum extent permitted by law, ${operatorName} is not liable
          for indirect, incidental or consequential losses, or for losses arising
          from decisions you make based on information in the Service. Nothing in
          these Terms excludes liability that cannot lawfully be excluded,
          including your mandatory consumer rights.
        </p>`,
    },
    {
      id: 'termination',
      title: '9. Termination and deletion',
      body: `
        <p>
          You can stop using the Service at any time and delete your account in
          the app (Profile → Delete Account) or through our
          <a href="${base}/legal/account-deletion">account deletion page</a>. We
          may suspend accounts that violate these Terms or create security risks.
        </p>`,
    },
    {
      id: 'privacy',
      title: '10. Privacy',
      body: `
        <p>
          Our <a href="${base}/legal/privacy">Privacy Policy</a> explains how we
          handle personal information and forms part of these Terms.
        </p>`,
    },
    {
      id: 'governing-law',
      title: '11. Governing law',
      body: `
        <p>
          These Terms are governed by the laws of ${country}, without regard to
          conflict-of-law rules. Disputes will be handled by the competent courts
          of ${country}, except where mandatory consumer protection law in your
          country of residence gives you the right to bring a claim locally.
        </p>`,
    },
    {
      id: 'changes',
      title: '12. Changes to these Terms',
      body: `
        <p>
          We may update these Terms. Continued use after an update means you
          accept the revised Terms. The date at the top of this page shows the
          latest version.
        </p>`,
    },
    {
      id: 'contact',
      title: '13. Contact',
      body: `
        <p>
          Questions about these Terms:
          <a href="mailto:${contactEmail}">${contactEmail}</a>.
        </p>`,
    },
  ];

  return layout(
    {
      title: 'Terms of Service',
      description: `The terms that govern your use of ${appName}.`,
      key: 'terms',
      intro: `The rules for using ${appName}: what the Service does, what we
        expect from you, and how disputes are handled.`,
      glance: [
        ['Cost', 'The core app is free to use.'],
        ['Your data', 'You keep ownership of the records you enter.'],
        ['Not a bank', 'No money movement and no financial advice.'],
        ['Support', `Email ${contactEmail} for questions about these Terms.`],
      ],
      sections,
    },
    options,
  );
}

export function renderAccountDeletion(options: LegalPageOptions): string {
  const appName = escapeHtml(options.appName);
  const operatorName = escapeHtml(options.operatorName);
  const contactEmail = escapeHtml(options.contactEmail);

  const sections: LegalSection[] = [
    {
      id: 'delete-in-the-app',
      title: 'Delete in the app (recommended)',
      body: `
        <p>
          You can permanently delete your ${appName} account and the data linked
          to it at any time. There is no charge and you do not need to contact
          support first.
        </p>
        <ol>
          <li>Open ${appName} and sign in.</li>
          <li>Go to the <strong>Profile</strong> tab.</li>
          <li>
            Scroll to the <strong>Account</strong> section and tap
            <strong>Delete Account</strong>.
          </li>
          <li>Confirm the deletion.</li>
        </ol>
        <p>
          You are signed out and your account is removed immediately. Wallets,
          transactions, categories, budgets and reminders are deleted with it
          through cascading deletes.
        </p>`,
    },
    {
      id: 'delete-without-the-app',
      title: 'Delete without the app',
      body: `
        <p>
          If you cannot sign in, email
          <a href="mailto:${contactEmail}?subject=Account%20deletion%20request">
            ${contactEmail}</a>
          from the email address registered to your account, with the subject
          "Account deletion request". We will verify ownership and complete the
          deletion within 30 days.
        </p>
        <p>
          The same address can be used to ask what data is associated with your
          account or to request deletion of data you believe is still linked to
          you.
        </p>`,
    },
    {
      id: 'what-is-deleted',
      title: 'What is deleted',
      body: `
        <ul>
          <li>
            Your account profile: email address, display name, profile photo and
            authentication identifiers.
          </li>
          <li>All wallets and balances you created.</li>
          <li>All transactions and notes.</li>
          <li>All categories, budgets and bill reminders.</li>
          <li>Any active session for the account.</li>
        </ul>
        <p>
          Deletion is permanent. Deleted financial records cannot be recovered,
          so export anything you need before you confirm.
        </p>`,
    },
    {
      id: 'what-is-retained',
      title: 'What may be retained',
      body: `
        <p>
          Encrypted backup copies of the database may persist for up to 30 days
          before being overwritten. Product analytics events are linked to a
          random identifier rather than your identity and are retained for up to
          12 months; after your account is deleted they can no longer be
          connected to you. Error diagnostics are retained for up to 90 days. We
          may also retain minimal records if required by law, for example for
          fraud prevention or tax obligations.
        </p>`,
    },
    {
      id: 'google-sign-in',
      title: 'If you signed in with Google',
      body: `
        <p>
          Deleting your ${appName} account removes the profile and records we
          hold. It does not delete your Google account. To remove ${appName}'s
          access to your Google account, visit
          <a href="https://myaccount.google.com/permissions" rel="noopener noreferrer">Google Account permissions</a>
          and remove access for ${appName}.
        </p>`,
    },
    {
      id: 'questions',
      title: 'Questions',
      body: `
        <p>
          Contact ${operatorName} at
          <a href="mailto:${contactEmail}">${contactEmail}</a> if you need help
          with deletion or want to know what data is associated with your
          account.
        </p>`,
    },
  ];

  return layout(
    {
      title: 'Delete your account',
      description: `How to permanently delete your ${appName} account and the data linked to it.`,
      key: 'account-deletion',
      intro: `You can delete your ${appName} account and the data linked to it at
        any time, without contacting support first.`,
      glance: [
        ['In the app', 'Profile → Delete Account.'],
        ['By email', `${contactEmail}, subject "Account deletion request".`],
        ['Effect', 'Account and financial records are deleted immediately.'],
        ['Backups', 'Encrypted copies are overwritten within 30 days.'],
      ],
      sections,
    },
    options,
  );
}

export function renderLegalIndex(options: LegalPageOptions): string {
  const appName = escapeHtml(options.appName);
  const operatorName = escapeHtml(options.operatorName);
  const contactEmail = escapeHtml(options.contactEmail);
  const base = escapeHtml(options.basePath ?? '');
  const canonical = options.canonicalBase
    ? `<link rel="canonical" href="${escapeHtml(options.canonicalBase)}/" />`
    : '';

  const cards: Array<[LegalPageKey, string, string, string]> = [
    [
      'privacy',
      'Privacy',
      'Privacy Policy',
      'What we collect, who processes it, and how to get it deleted.',
    ],
    [
      'terms',
      'Terms',
      'Terms of Service',
      'The rules for using the app, accounts, content and liability.',
    ],
    [
      'account-deletion',
      'Account',
      'Delete your account',
      'Delete your account and data in the app or by email.',
    ],
  ];

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="Privacy and legal information for ${appName}." />
    <meta name="robots" content="index, follow" />
    <meta name="theme-color" content="#f4f1ea" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#121311" media="(prefers-color-scheme: dark)" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'" />
    ${canonical}
    <link rel="icon" href="${FAVICON}" />
    <title>${appName} · Legal</title>
    <style>${INDEX_STYLES}</style>
  </head>
  <body>
    <div class="wrap">
      <a class="brand" href="${base}/">
        <span class="brand-mark" aria-hidden="true">M</span>
        <span>${appName}</span>
      </a>
      <p class="eyebrow">Legal &amp; privacy</p>
      <h1>Privacy, plainly explained.</h1>
      <p class="lede">
        Everything about how ${appName} handles your data, the rules for using
        the app, and how to delete your account.
      </p>
      <div class="cards">
        ${cards
          .map(
            ([
              key,
              kicker,
              title,
              text,
            ]) => `<a class="card" href="${base}/legal/${key}">
          <span>
            <span class="card-kicker">${kicker}</span>
            <span class="card-title">${title}</span>
            <span class="card-text">${text}</span>
          </span>
          <span class="card-arrow" aria-hidden="true">→</span>
        </a>`,
          )
          .join('\n        ')}
      </div>
      <footer>
        ${appName} is operated by ${operatorName}.
        <a href="mailto:${contactEmail}">${contactEmail}</a>
      </footer>
    </div>
  </body>
</html>`;
}

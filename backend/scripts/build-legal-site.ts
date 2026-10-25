import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  DEFAULT_LEGAL_OPTIONS,
  LegalPageOptions,
  renderAccountDeletion,
  renderLegalIndex,
  renderPrivacyPolicy,
  renderTermsOfService,
} from '../src/legal/legal.content';

// Served by GitHub Pages from the /docs folder of `main`, so the site root is
// https://vileyy.github.io/monevo/ and every link needs that prefix.
const BASE_PATH = process.env.LEGAL_SITE_BASE_PATH ?? '/monevo';
const SITE_URL = (
  process.env.LEGAL_SITE_URL ?? 'https://vileyy.github.io/monevo'
).replace(/\/+$/, '');
const outDir = resolve(__dirname, '../../docs');

const options: LegalPageOptions = {
  appName: process.env.LEGAL_APP_NAME || DEFAULT_LEGAL_OPTIONS.appName,
  operatorName:
    process.env.LEGAL_OPERATOR_NAME || DEFAULT_LEGAL_OPTIONS.operatorName,
  contactEmail:
    process.env.LEGAL_CONTACT_EMAIL || DEFAULT_LEGAL_OPTIONS.contactEmail,
  country: process.env.LEGAL_COUNTRY || DEFAULT_LEGAL_OPTIONS.country,
  lastUpdated:
    process.env.LEGAL_LAST_UPDATED || DEFAULT_LEGAL_OPTIONS.lastUpdated,
  basePath: BASE_PATH,
  canonicalBase: SITE_URL,
};

function writeFile(relativePath: string, contents: string): void {
  const target = resolve(outDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents, 'utf8');
  process.stdout.write(`wrote ${target}\n`);
}

function renderSitemap(): string {
  const paths = [
    '/',
    '/legal/privacy/',
    '/legal/terms/',
    '/legal/account-deletion/',
  ];
  const urls = paths
    .map(
      (path) =>
        `  <url>\n    <loc>${SITE_URL}${path}</loc>\n    <lastmod>${options.lastUpdated}</lastmod>\n  </url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

writeFile('legal/privacy/index.html', renderPrivacyPolicy(options));
writeFile('legal/terms/index.html', renderTermsOfService(options));
writeFile('legal/account-deletion/index.html', renderAccountDeletion(options));
writeFile('index.html', renderLegalIndex(options));
writeFile('sitemap.xml', renderSitemap());
writeFile('.nojekyll', '');

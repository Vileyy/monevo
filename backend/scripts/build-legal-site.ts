import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  DEFAULT_LEGAL_OPTIONS,
  LegalPageOptions,
  renderAccountDeletion,
  renderPrivacyPolicy,
  renderTermsOfService,
} from '../src/legal/legal.content';

// Served by GitHub Pages from the /docs folder of `main`, so the site root is
// https://vileyy.github.io/monevo/ and every link needs that prefix.
const BASE_PATH = process.env.LEGAL_SITE_BASE_PATH ?? '/monevo';
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
};

function writeFile(relativePath: string, contents: string): void {
  const target = resolve(outDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents, 'utf8');
  process.stdout.write(`wrote ${target}\n`);
}

function renderIndex(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${options.appName} · Legal</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f8fafc;
        color: #0f172a;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          "Helvetica Neue", Arial, sans-serif;
      }
      main { padding: 32px 24px; text-align: center; }
      h1 { font-size: 26px; margin: 0 0 6px; }
      p { color: #475569; margin: 0 0 24px; }
      nav { display: grid; gap: 12px; }
      a {
        display: block;
        padding: 14px 20px;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        background: #ffffff;
        color: #0f766e;
        font-weight: 600;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${options.appName}</h1>
      <p>Privacy and legal information</p>
      <nav>
        <a href="${BASE_PATH}/legal/privacy">Privacy Policy</a>
        <a href="${BASE_PATH}/legal/terms">Terms of Service</a>
        <a href="${BASE_PATH}/legal/account-deletion">Delete your account</a>
      </nav>
    </main>
  </body>
</html>`;
}

writeFile('legal/privacy/index.html', renderPrivacyPolicy(options));
writeFile('legal/terms/index.html', renderTermsOfService(options));
writeFile('legal/account-deletion/index.html', renderAccountDeletion(options));
writeFile('index.html', renderIndex());
writeFile('.nojekyll', '');

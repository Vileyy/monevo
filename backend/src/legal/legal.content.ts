export interface LegalPageOptions {
  appName: string;
  contactEmail: string;
  lastUpdated: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function layout(
  title: string,
  options: LegalPageOptions,
  body: string,
): string {
  const appName = escapeHtml(options.appName);
  const contactEmail = escapeHtml(options.contactEmail);
  const lastUpdated = escapeHtml(options.lastUpdated);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="index, follow" />
    <title>${escapeHtml(title)} · ${appName}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f8fafc;
        --surface: #ffffff;
        --text: #0f172a;
        --muted: #475569;
        --border: #e2e8f0;
        --accent: #0f766e;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          "Helvetica Neue", Arial, sans-serif;
        line-height: 1.65;
      }
      main {
        max-width: 760px;
        margin: 0 auto;
        padding: 40px 20px 72px;
      }
      header {
        margin-bottom: 28px;
      }
      .brand {
        display: inline-block;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--accent);
        margin-bottom: 10px;
      }
      h1 {
        font-size: 30px;
        line-height: 1.2;
        margin: 0 0 8px;
      }
      h2 {
        font-size: 20px;
        margin: 32px 0 10px;
      }
      h3 {
        font-size: 16px;
        margin: 22px 0 8px;
      }
      p, li { color: var(--muted); }
      a { color: var(--accent); font-weight: 600; }
      article {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 28px;
      }
      ul, ol { padding-left: 22px; }
      li { margin: 6px 0; }
      .meta {
        font-size: 13px;
        color: var(--muted);
      }
      .notice {
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
        border-radius: 12px;
        padding: 14px 16px;
        margin: 18px 0;
        color: #065f46;
      }
      nav {
        margin-top: 24px;
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        font-size: 14px;
      }
      footer {
        margin-top: 24px;
        font-size: 13px;
        color: var(--muted);
      }
      @media (max-width: 520px) {
        article { padding: 20px; }
        h1 { font-size: 25px; }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <span class="brand">${appName}</span>
        <h1>${escapeHtml(title)}</h1>
        <p class="meta">Last updated: ${lastUpdated}</p>
      </header>
      <article>${body}</article>
      <nav>
        <a href="/legal/privacy">Privacy Policy</a>
        <a href="/legal/terms">Terms of Service</a>
        <a href="/legal/account-deletion">Delete Account</a>
      </nav>
      <footer>
        ${appName} · <a href="mailto:${contactEmail}">${contactEmail}</a>
      </footer>
    </main>
  </body>
</html>`;
}

export function renderPrivacyPolicy(options: LegalPageOptions): string {
  const appName = escapeHtml(options.appName);
  const contactEmail = escapeHtml(options.contactEmail);

  return layout(
    'Privacy Policy',
    options,
    `
      <p>
        This Privacy Policy explains how ${appName} ("we", "us", "our")
        collects, uses, stores and deletes information when you use the
        ${appName} mobile application and API (the "Service").
      </p>

      <h2>1. Who we are</h2>
      <p>
        ${appName} is a personal finance application that helps you record
        wallets, transactions, budgets and bill reminders. For privacy
        questions or requests, contact us at
        <a href="mailto:${contactEmail}">${contactEmail}</a>.
      </p>

      <h2>2. Information we collect</h2>
      <h3>Account information</h3>
      <ul>
        <li>Email address and display name.</li>
        <li>
          Authentication identifiers issued by our identity provider (Clerk),
          and — if you choose Google Sign-In — your Google account email and
          basic profile.
        </li>
        <li>An internal user identifier used to link your records.</li>
      </ul>

      <h3>Financial information you enter</h3>
      <ul>
        <li>Wallet names, types and balances.</li>
        <li>Income and expense transactions, notes and dates.</li>
        <li>Categories, monthly budgets and bill reminders.</li>
      </ul>
      <p>
        This information is stored so the Service can show it back to you. We
        do not connect to your bank and we do not receive your bank
        credentials.
      </p>

      <h3>Technical information</h3>
      <ul>
        <li>
          Authentication logs and limited device/network information processed
          by Clerk to protect your account and prevent abuse.
        </li>
        <li>
          Notification permission status. Bill reminders are scheduled locally
          on your device and are not sent to our servers.
        </li>
      </ul>
      <p>
        We do not use advertising SDKs and we do not sell personal data.
      </p>

      <h2>3. How we use information</h2>
      <ul>
        <li>To create and secure your account and sign you in.</li>
        <li>To store and display the financial records you enter.</li>
        <li>To schedule bill reminder notifications you enable.</li>
        <li>To maintain, troubleshoot and secure the Service.</li>
        <li>To respond to support and privacy requests.</li>
      </ul>

      <h2>4. Legal bases</h2>
      <p>
        Where applicable, we process information to perform our contract with
        you, to comply with legal obligations, to protect the Service, and
        based on your consent (for example, notification permission, which you
        can revoke in your device settings).
      </p>

      <h2>5. Sharing and service providers</h2>
      <p>We share information only with providers that help us run the Service:</p>
      <ul>
        <li><strong>Clerk</strong> — authentication and session management.</li>
        <li><strong>Google</strong> — only if you choose Google Sign-In.</li>
        <li>
          <strong>Amazon Web Services</strong> — hosting for the API and
          PostgreSQL database.
        </li>
        <li><strong>Expo</strong> — application build and distribution tooling.</li>
      </ul>
      <p>
        These providers process data on our behalf and are not permitted to use
        it for their own advertising. We may also disclose information when
        required by law or to protect rights and safety.
      </p>

      <h2>6. Storage, security and retention</h2>
      <p>
        Account and financial records are stored in our PostgreSQL database.
        Production traffic is served over HTTPS/TLS, access is restricted to
        authorized operators, and authentication tokens on the device are kept
        in the platform secure store.
      </p>
      <p>
        We retain your information while your account exists. When you delete
        your account, we delete your account and associated financial records.
        Residual copies may remain in encrypted backups for a limited period
        (normally no more than 30 days) before being overwritten.
      </p>

      <h2>7. Your rights</h2>
      <p>Depending on your location, you may have the right to:</p>
      <ul>
        <li>Access and receive a copy of your information.</li>
        <li>Correct inaccurate account information.</li>
        <li>Delete your account and associated data.</li>
        <li>Withdraw consent (for example, disable notifications).</li>
        <li>Object to or restrict certain processing.</li>
      </ul>
      <p>
        You can delete your account directly in the app: Profile → Delete
        Account. You can also use our
        <a href="/legal/account-deletion">account deletion page</a> or email
        <a href="mailto:${contactEmail}">${contactEmail}</a>. We respond to
        verified requests within 30 days.
      </p>

      <h2>8. Children</h2>
      <p>
        The Service is not directed to children under 13 (or the minimum age in
        your country). We do not knowingly collect data from children.
      </p>

      <h2>9. International transfers</h2>
      <p>
        Our providers may process information in countries other than yours.
        Where required, we rely on appropriate safeguards for those transfers.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update this Privacy Policy. If we make material changes, we will
        update the date above and, where appropriate, notify you in the app.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions or requests:
        <a href="mailto:${contactEmail}">${contactEmail}</a>.
      </p>
    `,
  );
}

export function renderTermsOfService(options: LegalPageOptions): string {
  const appName = escapeHtml(options.appName);
  const contactEmail = escapeHtml(options.contactEmail);

  return layout(
    'Terms of Service',
    options,
    `
      <p>
        These Terms of Service ("Terms") govern your use of the ${appName}
        mobile application and API (the "Service"). By creating an account or
        using the Service, you agree to these Terms.
      </p>

      <h2>1. The Service</h2>
      <p>
        ${appName} is a personal bookkeeping tool that lets you record wallets,
        transactions, budgets and bill reminders, and view summaries based on
        the information you enter.
      </p>

      <div class="notice">
        ${appName} is not a bank, payment service or licensed financial adviser.
        Balances and insights are calculated only from the information you
        enter and may be incomplete or inaccurate. Nothing in the Service is
        financial, tax, legal or investment advice.
      </div>

      <h2>2. Accounts</h2>
      <ul>
        <li>You must provide accurate account information.</li>
        <li>
          You are responsible for keeping access to your email account secure;
          sign-in links and verification codes are sensitive.
        </li>
        <li>You must be at least 13 years old (or the minimum age in your country).</li>
        <li>One person or organization per account; do not share your account.</li>
      </ul>

      <h2>3. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for unlawful, fraudulent or abusive activity.</li>
        <li>Attempt to access other users' data or bypass authentication.</li>
        <li>Probe, scan or disrupt the Service or its infrastructure.</li>
        <li>
          Reverse engineer or copy the Service except as permitted by law.
        </li>
      </ul>

      <h2>4. Your content</h2>
      <p>
        You keep ownership of the records you enter. You grant us a limited
        license to store, process and display that content solely to operate
        the Service for you.
      </p>

      <h2>5. Availability and changes</h2>
      <p>
        We aim to keep the Service available, but it is provided on an "as is"
        and "as available" basis. We may change, suspend or discontinue features
        and will make reasonable efforts to give notice of material changes.
      </p>

      <h2>6. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, ${appName} is not liable for
        indirect, incidental or consequential losses, or for losses arising from
        decisions you make based on information in the Service. Nothing in these
        Terms excludes liability that cannot lawfully be excluded.
      </p>

      <h2>7. Termination and deletion</h2>
      <p>
        You can stop using the Service at any time and delete your account in
        the app (Profile → Delete Account) or through our
        <a href="/legal/account-deletion">account deletion page</a>. We may
        suspend accounts that violate these Terms or create security risks.
      </p>

      <h2>8. Privacy</h2>
      <p>
        Our <a href="/legal/privacy">Privacy Policy</a> explains how we handle
        personal information and forms part of these Terms.
      </p>

      <h2>9. Changes to these Terms</h2>
      <p>
        We may update these Terms. Continued use after an update means you
        accept the revised Terms. The date at the top shows the latest version.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions about these Terms:
        <a href="mailto:${contactEmail}">${contactEmail}</a>.
      </p>
    `,
  );
}

export function renderAccountDeletion(options: LegalPageOptions): string {
  const appName = escapeHtml(options.appName);
  const contactEmail = escapeHtml(options.contactEmail);

  return layout(
    'Delete your account',
    options,
    `
      <p>
        You can permanently delete your ${appName} account and the data linked
        to it at any time. There is no charge and you do not need to contact
        support first.
      </p>

      <h2>Delete in the app (recommended)</h2>
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
        You will be signed out and your account row is removed immediately.
        Wallets, transactions, categories, budgets and reminders are deleted
        with it through cascading deletes.
      </p>

      <h2>Delete by email</h2>
      <p>
        If you cannot sign in, email
        <a href="mailto:${contactEmail}?subject=Account%20deletion%20request">
          ${contactEmail}</a>
        from the email address registered to your account, with the subject
        "Account deletion request". We will verify ownership and complete the
        deletion within 30 days.
      </p>

      <h2>What is deleted</h2>
      <ul>
        <li>Your account profile: email address, display name, auth identifiers.</li>
        <li>All wallets and balances you created.</li>
        <li>All transactions and notes.</li>
        <li>All categories, budgets and bill reminders.</li>
        <li>Any active session for the account.</li>
      </ul>

      <h2>What may be retained</h2>
      <p>
        Encrypted backup copies of the database may persist for up to 30 days
        before being overwritten. We may also retain minimal records if
        required by law (for example, fraud-prevention or tax obligations).
      </p>

      <h2>Questions</h2>
      <p>
        Contact <a href="mailto:${contactEmail}">${contactEmail}</a> if you need
        help with deletion or want to know what data is associated with your
        account.
      </p>
    `,
  );
}

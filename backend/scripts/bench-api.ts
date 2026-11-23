import 'dotenv/config';

/**
 * Measures real API latency per endpoint and splits it into application time
 * and database time using the `Server-Timing` header.
 *
 *   pnpm --filter backend bench:api
 *
 * Env: API_BASE_URL, BENCH_EMAIL, BENCH_PASSWORD, REQUESTS, WARMUP.
 */
const BASE_URL = (process.env.API_BASE_URL ?? 'http://127.0.0.1:3000').replace(
  /\/+$/,
  '',
);
const EMAIL = (process.env.BENCH_EMAIL ?? 'bench@monevo.app').toLowerCase();
const PASSWORD = process.env.BENCH_PASSWORD ?? 'bench-password';
const REQUESTS = Number(process.env.REQUESTS ?? 200);
const WARMUP = Number(process.env.WARMUP ?? 10);

interface Sample {
  totalMs: number;
  appMs: number;
  dbMs: number;
  queries: number;
}

interface Endpoint {
  name: string;
  path: string;
  auth: boolean;
}

const ENDPOINTS: Endpoint[] = [
  { name: 'health', path: '/health', auth: false },
  { name: 'currency rates (cached)', path: '/currency/rates', auth: false },
  { name: 'wallets list', path: '/wallets', auth: true },
  { name: 'categories list', path: '/categories', auth: true },
  {
    name: 'tx page 1 (limit 20)',
    path: '/transactions?page=1&limit=20',
    auth: true,
  },
  {
    name: 'tx page 50 (limit 20)',
    path: '/transactions?page=50&limit=20',
    auth: true,
  },
  {
    name: 'tx search "coffee"',
    path: '/transactions?page=1&limit=20&search=coffee',
    auth: true,
  },
  { name: 'tx summary', path: '/transactions/summary', auth: true },
];

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[index];
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function parseServerTiming(header: string | null): {
  appMs: number;
  dbMs: number;
  queries: number;
} {
  if (!header) return { appMs: 0, dbMs: 0, queries: 0 };

  const app = /app;dur=([\d.]+)/.exec(header);
  const db = /db;dur=([\d.]+)/.exec(header);
  const dbq = /dbq;desc="(\d+)"/.exec(header);

  return {
    appMs: app ? Number(app[1]) : 0,
    dbMs: db ? Number(db[1]) : 0,
    queries: dbq ? Number(dbq[1]) : 0,
  };
}

async function login(): Promise<string> {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  if (!response.ok) {
    throw new Error(
      `login failed (${response.status}): ${await response.text()}`,
    );
  }

  const body = (await response.json()) as { accessToken?: string };
  if (!body.accessToken) {
    throw new Error('login response did not include accessToken');
  }
  return body.accessToken;
}

async function measure(
  endpoint: Endpoint,
  token: string,
  iterations: number,
): Promise<Sample[]> {
  const samples: Sample[] = [];

  for (let i = 0; i < iterations; i += 1) {
    const startedAt = performance.now();
    const response = await fetch(`${BASE_URL}${endpoint.path}`, {
      headers: endpoint.auth ? { authorization: `Bearer ${token}` } : {},
    });
    const totalMs = performance.now() - startedAt;
    const body = await response.arrayBuffer();

    if (!response.ok) {
      throw new Error(
        `${endpoint.path} returned ${response.status}: ${Buffer.from(body).toString().slice(0, 200)}`,
      );
    }

    const timing = parseServerTiming(response.headers.get('server-timing'));
    samples.push({ totalMs, ...timing });
  }

  return samples;
}

function formatRow(name: string, samples: Sample[]): string {
  const totals = samples.map((s) => s.totalMs).sort((a, b) => a - b);
  const apps = samples.map((s) => s.appMs).sort((a, b) => a - b);
  const dbs = samples.map((s) => s.dbMs).sort((a, b) => a - b);
  const queries = Math.round(mean(samples.map((s) => s.queries)));

  return [
    name.padEnd(24),
    String(samples.length).padStart(5),
    mean(totals).toFixed(2).padStart(8),
    percentile(totals, 50).toFixed(2).padStart(8),
    percentile(totals, 95).toFixed(2).padStart(8),
    percentile(totals, 99).toFixed(2).padStart(8),
    mean(apps).toFixed(2).padStart(8),
    percentile(dbs, 50).toFixed(2).padStart(8),
    String(queries).padStart(5),
  ].join('  ');
}

async function main(): Promise<void> {
  const token = await login();
  console.log(
    `benchmarking ${BASE_URL} — ${REQUESTS} requests per endpoint, ${WARMUP} warmup\n`,
  );

  console.log(
    [
      'endpoint'.padEnd(24),
      'n'.padStart(5),
      'mean'.padStart(8),
      'p50'.padStart(8),
      'p95'.padStart(8),
      'p99'.padStart(8),
      'app p50'.padStart(8),
      'db p50'.padStart(8),
      'q'.padStart(5),
    ].join('  '),
  );

  for (const endpoint of ENDPOINTS) {
    await measure(endpoint, token, WARMUP);
    const samples = await measure(endpoint, token, REQUESTS);
    console.log(formatRow(endpoint.name, samples));
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

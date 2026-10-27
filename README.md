<p align="center">
  <img src=".github/assets/icon.png" width="120" alt="Monevo app icon" />
</p>

<h1 align="center">Monevo</h1>

<p align="center">
  <strong>Know where your money goes.</strong><br />
  A personal finance app for Android: record spending in seconds, keep wallets, budgets and bills in one place, and see where the money actually goes.
</p>

<p align="center">
  <a href="https://github.com/Vileyy/monevo/actions/workflows/ci.yml"><img src="https://github.com/Vileyy/monevo/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <img src="https://img.shields.io/badge/Expo-SDK%2057-000020?style=flat-square&logo=expo&logoColor=white" alt="Expo SDK 57" />
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS 11" />
  <img src="https://img.shields.io/badge/PostgreSQL-17-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL 17" />
  <img src="https://img.shields.io/badge/platform-Android-3DDC84?style=flat-square&logo=android&logoColor=white" alt="Android" />
</p>

---

## Features

| Area             | What you get                                                                          |
| ---------------- | ------------------------------------------------------------------------------------- |
| **Wallets**      | Multiple wallets with live balances                                                   |
| **Transactions** | Income and expenses, notes, custom categories, filters, currency conversion           |
| **Budgets**      | Monthly limits per category, overspending warnings                                    |
| **Reminders**    | Bill due dates with scheduled local notifications                                     |
| **Insights**     | Period totals and a category breakdown                                                |
| **Accounts**     | Email/password and Google sign-in via Clerk, secure session storage, biometric unlock |

Not built yet: transaction search UI, CSV/Excel export, receipt photos, offline caching and sync.

## Stack

| Layer    | Technology                                                                  |
| -------- | --------------------------------------------------------------------------- |
| App      | Expo SDK 57, Expo Router, React Native 0.86, Zustand, TanStack Query, Axios |
| API      | NestJS 11, JWT, class-validator, Swagger                                    |
| Database | PostgreSQL 17, Prisma 7 (`prisma-client` + `@prisma/adapter-pg`)            |
| Auth     | Clerk (Google sign-in) issuing the API JWT, plus biometric unlock on device |
| Infra    | Docker Compose on a single EC2 instance, GitHub Actions CI                  |

## Repository layout

```text
monevo/
├── frontend/                 Expo app (src/app = routes, src/store, src/services)
├── backend/                  NestJS API (src/<feature>, prisma/ = schema + migrations)
├── docs/                     Published legal pages (GitHub Pages)
├── deploy/                   Production Compose file + entrypoint
├── docker-compose.yml        Local PostgreSQL only
└── AGENTS.md                 Operational source of truth
```

## Getting started

Requirements: Node 22+, pnpm 11, Docker, and Expo Go or a development build on an Android device.

```bash
pnpm install
docker compose up -d          # PostgreSQL 17 on 127.0.0.1:5432 (monevo / monevo_dev)
```

Create the environment files:

- `frontend/.env` — copy `frontend/.env.example`, then set `EXPO_PUBLIC_API_URL` plus the Clerk and PostHog keys.
- `backend/.env` — `DATABASE_URL=postgresql://monevo:monevo_dev@127.0.0.1:5432/monevo`, plus `JWT_SECRET` and `CLERK_SECRET_KEY`.

Run the API and the app:

```bash
pnpm --filter backend exec prisma migrate deploy
pnpm --filter backend start:dev     # http://localhost:3000 — Swagger at /api, health at /health

cd frontend && npx expo start
```

`EXPO_PUBLIC_API_URL` is baked in at bundle time: restart Expo after editing it, and point it at an address the phone can reach (LAN or public IP), not `localhost`.

## Commands

| Command                             | What it does                 |
| ----------------------------------- | ---------------------------- |
| `pnpm test`                         | Unit tests for both packages |
| `pnpm lint`                         | ESLint for both packages     |
| `pnpm typecheck`                    | TypeScript, no emit          |
| `pnpm format` / `pnpm format:check` | Prettier across the repo     |
| `pnpm build`                        | Compile the API              |
| `pnpm --filter backend db:seed`     | Seed development data        |

## Quality gates

- **Pre-commit** (Husky, installed by `pnpm install`) — runs the unit tests, then ESLint, Prettier and TypeScript on staged files. A failure blocks the commit.
- **CI** on pull requests and pushes to `main` — lint, typecheck, tests, build, formatting check and dependency audit.
- **Commit messages** follow Conventional Commits (`feat(app): add currency picker`) and are checked by commitlint on commit and in CI.
- One Prettier config at the repository root, so every contributor commits the same style.

## Request flow

```text
Expo  →  Axios (EXPO_PUBLIC_API_URL, https://)
      →  Caddy :443 (Let's Encrypt)
      →  NestJS :3000 (internal)
      →  JWT guard on user data routes
      →  Prisma (pg adapter)
      →  PostgreSQL
```

Sign-in endpoints, `/health`, `/currency/rates` and `/legal/*` are public. Google sign-in goes through Clerk, `POST /auth/clerk` exchanges the Clerk session for an API JWT, and the session is cached in `expo-secure-store`. Email/password sign-in uses `POST /auth/login` and `POST /auth/register`.

## Deployment

Production is a single EC2 instance running `deploy/docker-compose.yml` (Caddy + API + PostgreSQL). Caddy terminates HTTPS with a Let's Encrypt certificate and proxies to the API over the internal Docker network. The API container applies migrations and then starts the compiled server. Machines, environment files, database access, deploy steps and known pitfalls are documented in [AGENTS.md](AGENTS.md) — read it before touching production.

## Documentation

- [AGENTS.md](AGENTS.md) — stack, machines, env files, deploy and troubleshooting.
- `docs/` — privacy policy, terms of service and account deletion pages, generated by `pnpm --filter backend legal:build` and published from `main`.

## License

Private project. License terms will be added before public release.

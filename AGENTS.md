# Monevo — AGENTS.md

Operational source of truth for humans and agents. The root README (FastAPI / `apps/mobile`) is **stale**. Follow this file.

## 1. What this is

Personal finance app: Expo (Android-first) + NestJS API + PostgreSQL.

Shipped: email/password + Google/Clerk sign-in, wallets, transactions, budgets, bill reminders, insights, HTTPS API. Not yet: CSV export, receipt photos, offline sync, Play Store release.

## 2. Actual stack

| Layer    | Tech                                                                      |
| -------- | ------------------------------------------------------------------------- |
| App      | Expo SDK **57**, Expo Router, Zustand, Axios                              |
| API      | NestJS 11, JWT, class-validator, Swagger `/api`                           |
| DB       | PostgreSQL 17, Prisma **7** (`prisma-client` + `@prisma/adapter-pg`)      |
| Monorepo | pnpm workspaces: `frontend/`, `backend/`                                  |
| Prod     | One EC2 `t3.micro` (Sydney), Docker Compose: `caddy` + `api` + `postgres` |

No FastAPI, Redis, RDS, or ALB.

## 3. Repo tree (what actually ships)

```
monevo/
├── frontend/          # Expo app
│   ├── src/app/       # routes: login, register, (tabs), add-transaction
│   ├── src/store/     # auth, wallet, transaction, category
│   ├── src/services/api/client.ts   # baseURL = EXPO_PUBLIC_API_URL
│   └── .env           # local, gitignored
├── backend/
│   ├── src/           # Nest modules: auth, users, wallets, categories, transactions
│   └── prisma/        # schema.prisma + migrations/
├── deploy/            # prod compose + Caddy + entrypoint + .env.example
│   ├── docker-compose.yml
│   ├── Caddyfile      # HTTPS + reverse proxy to api:3000
│   ├── docker-entrypoint.sh   # migrate deploy, then node dist/src/main.js
│   └── .env           # EC2 only — never commit
├── Dockerfile         # build context = repo root
└── docker-compose.yml # DEV local Postgres :5432 — do NOT use on EC2
```

## 4. Two machines — read the prompt before typing

| Prompt                 | Machine | Allowed                                     |
| ---------------------- | ------- | ------------------------------------------- |
| `viley@MacBook-Pro...` | Mac     | git, expo, scp, ssh, prisma migrate **dev** |
| `ec2-user@ip-...`      | AWS     | docker compose, psql, nano `deploy/.env`    |

`~/monevo` exists **only on EC2**. On Mac the path is `/Users/viley/Viley/Project/monevo`.

SSH:

```bash
ssh -i /Users/viley/Viley/Project/monevo-ec2.pem ec2-user@<PUBLIC_IP>
```

The `.pem` sits next to the `Project/` folder. Do not commit it. Do not copy it into `monevo/`.

## 5. Request path

```
Expo  →  Axios EXPO_PUBLIC_API_URL (https://<API_DOMAIN>)
      →  Caddy :443 (Let's Encrypt, HTTP→HTTPS redirect)
      →  api:3000 (Nest, bound to 127.0.0.1 on the host)
      →  JWT guard (except /auth/register, /auth/login, /health, /currency/rates, /legal/*)
      →  Prisma  →  postgres container (Docker hostname: postgres)
```

Login returns `{ user, accessToken }`. The token is persisted in SecureStore
(with biometric unlock); Zustand hydrates it on startup.

## 6. Env files

| File            | Where | Role                                                                                  |
| --------------- | ----- | ------------------------------------------------------------------------------------- |
| `frontend/.env` | Mac   | `EXPO_PUBLIC_API_URL=https://<API_DOMAIN>` — restart Expo after edits                 |
| `deploy/.env`   | EC2   | `POSTGRES_*`, `JWT_SECRET`, `API_DOMAIN`, `ACME_EMAIL`, `DEMO_*` — Compose reads this |
| Root `.env`     | Mac   | Local Prisma (`prisma+postgres://...`) — **not** for EC2                              |
| `backend/.env`  | Mac   | Local DB if used                                                                      |

Compose **builds** `DATABASE_URL`. Do not copy the root `.env` to the server.

`API_DOMAIN` must point at the instance (DNS A record) and the security group
must allow 80/443 for Caddy to obtain/renew the certificate. If the EC2 public
IP changes, a temporary `sslip.io` domain changes with it; a real domain is
strongly preferred.

## 7. Daily commands

**App (Mac):**

```bash
cd /Users/viley/Viley/Project/monevo/frontend
npx expo start
```

Expo must log `env: export EXPO_PUBLIC_API_URL`.

**API local (Mac, when not using AWS):** `docker compose up -d` at repo root (port **5432**), then `pnpm --filter backend start:dev`.

**API prod (EC2):**

```bash
cd ~/monevo
docker compose -f deploy/docker-compose.yml ps
docker compose -f deploy/docker-compose.yml logs api --tail 80
docker compose -f deploy/docker-compose.yml logs caddy --tail 80
```

Health check: `GET https://<API_DOMAIN>/health` (`{"status":"ok"}`).

Swagger is disabled in production (`SWAGGER_ENABLED=false`); enable it only
temporarily and close it again. Probe auth with `POST /auth/login`.

## 8. Code flow

1. API changes live in `backend/src/<feature>/` (controller → service → prisma).
2. App changes live in `frontend/src/` (screen → store → `apiClient`).
3. **Unit Tests (Mandatory):** Whenever a feature is implemented or modified in frontend or backend, write/update corresponding unit tests (`*.spec.ts` / `*.test.ts`).
4. **Pre-commit & Verification:** Pre-commit hook must run unit tests (`pnpm test` / lint-staged) and verification checks (typecheck/lint) to ensure no regressions before committing code.
5. **Formatting:** one style for the whole repo — root `.prettierrc` (single quotes, trailing commas, LF) + `.editorconfig`. `pnpm format` to fix, `pnpm format:check` to verify; lint-staged and CI both enforce it. Prettier skips `docs/` (generated), `deploy/`, `backend/generated`, native folders, and agent tooling.
6. **Ship to AWS only when you need a real device / shared backend.** Do not rebuild on `t3.micro` for local-only work.

**Commit messages:** Conventional Commits — `<type>(<scope>): <subject>`. Allowed types: `build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test`; scope lowercase; subject ≤ 100 chars, no trailing period, no Title Case. Enforced by `.husky/commit-msg` (commitlint) and the CI `commits` job, so `update`, `fix bug` or `wip` are rejected. Merge commits are ignored automatically.

New features: one vertical slice (DTO + service + one screen + unit tests). No budgets/offline until the core loop is solid.

Prisma 7 client output: `backend/generated/prisma`. Queries go through `PrismaService` (`pg` adapter).

Nest emits `dist/src/main.js` (`prisma.config.ts` widens `rootDir`). Entrypoint must run that file, not `dist/main`.

## 9. Database — two jobs

**A. Data** (rows): app or DBeaver. No migration.

**B. Schema** (columns/tables):

```
schema.prisma  →  prisma migrate dev --name ...   # Mac, backend/
               →  copy migrations to EC2
               →  docker compose exec api pnpm exec prisma migrate deploy
               →  if Nest code changed: compose up -d --build
```

Initial migration `20260808103006_init` **only creates `User`**. `Wallet` / `Category` / `Transaction` landed in `20260816024100_add_finance_tables` (applied manually on prod). Never `migrate dev` locally and skip `migrate deploy` on AWS — the API returns 500 `TableDoesNotExist`.

List tables on the **API** Postgres (`deploy-postgres-1`):

```bash
cd ~/monevo
docker compose -f deploy/docker-compose.yml exec postgres \
  psql -U monevo -d monevo -c '\dt'
```

Prisma table names: `"User"`, `"Wallet"`, `"Category"`, `"Transaction"`, `"Budget"`, `"Reminder"` (quoted, PascalCase).

## 10. DBeaver

SSH tunnel to `127.0.0.1:5432` **on EC2**, not Homebrew Postgres on the Mac.

1. EC2: postgres in `deploy/docker-compose.yml` binds `127.0.0.1:5432:5432` (do not open 5432 on the security group).
2. DBeaver Main: host `127.0.0.1`, port `5432`, db/user `monevo`, password = `POSTGRES_PASSWORD` on EC2.
3. SSH: host = public IP, user `ec2-user`, key `.pem`.
4. Driver properties: `sslmode=disable`.

`role "monevo" does not exist` → SSH tunnel off (you hit Mac Postgres).  
`Connection reset` → nothing listening on 5432 on EC2.

**Do not** run the root `docker-compose.yml` on EC2 (it creates a second `monevo-postgres:5433` and mixes databases). Prod is only `deploy/docker-compose.yml`.

## 11. Deploy API (Nest/Docker changes)

EC2 has a 2G swap file (`/swapfile`) — required on `t3.micro`. Reboot drops swap unless `/etc/fstab` is set.

```bash
# Mac: copy needed sources (never rsync .pnpm-store)
# EC2:
cd ~/monevo
docker compose -f deploy/docker-compose.yml up -d --build
```

Entrypoint: `prisma migrate deploy`, then `node dist/src/main.js`. First build ~5–15 minutes.

Compose now also runs `caddy` on 80/443. It obtains/renews the Let's Encrypt
certificate for `API_DOMAIN` and proxies to `api:3000`. The API port is bound
to `127.0.0.1` on the host, so only Caddy can reach it from outside.

Security group: SSH 22 = My IP; HTTP 80 + HTTPS 443 = 0.0.0.0/0. Port 3000 must
stay closed to the public. No RDS, no ALB.

AWS **trial** account: service stops when credits run out. Stop the instance to save credits; Start may **change the public IP**.

## 12. CI

`.github/workflows/ci.yml` — backend lint/typecheck/test/build, frontend lint/typecheck/test, audit. Triggers: PR/push to **`main`**. Work on `dev-hieu` does not run CI until a PR targets `main`.

## 13. Next work (do not skip ahead)

Shipped: email/password + Google/Clerk auth, transactions with search/filter/
sort/pagination, budgets, bill reminders, insights, HTTPS API.

1. Export transaction data / reports (CSV / Excel).
2. Receipt photo attachments for transactions.
3. Offline caching & sync.
4. Play Store internal testing / production release.
5. Replace the temporary API domain with a real domain before public release.

## 14. Known mistakes — do not repeat

| Symptom                        | Cause                                  |
| ------------------------------ | -------------------------------------- |
| `cd ~/monevo` fails on Mac     | Wrong machine                          |
| Docker sock error on Mac       | Docker commands belong on EC2          |
| `scp` cannot find `/Users/...` | You are already inside SSH             |
| `logs api--tail`               | Missing space: `logs api --tail 80`    |
| `Cannot find module dist/main` | Use `dist/src/main.js`                 |
| 500 on Wallet/Transaction      | Missing tables — migration not applied |
| SSH hangs                      | `t3.micro` OOM — reboot + swap         |
| Browser Instance Connect fails | SG SSH is My IP only                   |
| HTTPS cert timeout / `000`     | SG 80/443 closed or DNS wrong          |
| API 502 from Caddy             | API container down / not on `api:3000` |
| `http://IP:3000` unreachable   | Intentional: API binds `127.0.0.1`     |
| Play Data safety encryption    | Release build must use `https://` URL  |

## 15. Expo

Read `frontend/AGENTS.md` and Expo SDK 57 docs before changing native/UI code.

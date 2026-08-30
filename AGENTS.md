# Monevo — AGENTS.md

Operational source of truth for humans and agents. The root README (FastAPI / `apps/mobile`) is **stale**. Follow this file.

## 1. What this is

Personal finance app: Expo (Android-first) + NestJS API + PostgreSQL.

Current product loop: login → wallets → record a transaction → see it again. Not yet: budgets, offline, Play Store.

## 2. Actual stack

| Layer    | Tech                                                                 |
| -------- | -------------------------------------------------------------------- |
| App      | Expo SDK **57**, Expo Router, Zustand, Axios                         |
| API      | NestJS 11, JWT, class-validator, Swagger `/api`                      |
| DB       | PostgreSQL 17, Prisma **7** (`prisma-client` + `@prisma/adapter-pg`) |
| Monorepo | pnpm workspaces: `frontend/`, `backend/`                             |
| Prod     | One EC2 `t3.micro` (Sydney), Docker Compose: `api` + `postgres`      |

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
├── deploy/            # prod compose + entrypoint + .env.example
│   ├── docker-compose.yml
│   ├── docker-entrypoint.sh   # migrate deploy, then node dist/src/main.js
│   └── .env           # EC2 only — never commit
├── Dockerfile         # build context = repo root
└── docker-compose.yml # DEV local Postgres :5433 — do NOT use on EC2
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
Expo  →  Axios EXPO_PUBLIC_API_URL
      →  EC2 :3000 (Nest)
      →  JWT guard (except /auth/register, /auth/login)
      →  Prisma  →  postgres container (Docker hostname: postgres)
```

Login returns `{ user, accessToken }`. Zustand keeps the token in **RAM** — killing the app logs the user out.

## 6. Env files

| File            | Where | Role                                                                     |
| --------------- | ----- | ------------------------------------------------------------------------ |
| `frontend/.env` | Mac   | `EXPO_PUBLIC_API_URL=http://<PUBLIC_IP>:3000` — restart Expo after edits |
| `deploy/.env`   | EC2   | `POSTGRES_*`, `JWT_SECRET` — Compose reads this                          |
| Root `.env`     | Mac   | Local Prisma (`prisma+postgres://...`) — **not** for EC2                 |
| `backend/.env`  | Mac   | Local DB if used                                                         |

Compose **builds** `DATABASE_URL`. Do not copy the root `.env` to the server.

EC2 public IP **changes** after Stop/Start → update `frontend/.env` and restart Expo.

## 7. Daily commands

**App (Mac):**

```bash
cd /Users/viley/Viley/Project/monevo/frontend
npx expo start
```

Expo must log `env: export EXPO_PUBLIC_API_URL`.

**API local (Mac, when not using AWS):** `docker compose up -d` at repo root (port **5433**), then `pnpm --filter backend start:dev`.

**API prod (EC2):**

```bash
cd ~/monevo
docker compose -f deploy/docker-compose.yml ps
docker compose -f deploy/docker-compose.yml logs api --tail 80
```

Swagger: `http://<PUBLIC_IP>:3000/api`  
No `GET /` or `GET /health` on the running image (`AppController` is not registered on `AppModule`). Probe with `POST /auth/login` or Swagger.

## 8. Code flow

1. API changes live in `backend/src/<feature>/` (controller → service → prisma).
2. App changes live in `frontend/src/` (screen → store → `apiClient`).
3. **Unit Tests (Mandatory):** Whenever a feature is implemented or modified in frontend or backend, write/update corresponding unit tests (`*.spec.ts` / `*.test.ts`).
4. **Pre-commit & Verification:** Pre-commit hook must run unit tests (`pnpm test` / lint-staged) and verification checks (typecheck/lint) to ensure no regressions before committing code.
5. **Ship to AWS only when you need a real device / shared backend.** Do not rebuild on `t3.micro` for local-only work.

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

Prisma table names: `"User"`, `"Wallet"`, `"Category"`, `"Transaction"` (quoted, PascalCase).

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

Security group: SSH 22 = My IP; TCP 3000 = 0.0.0.0/0. No RDS, no ALB.

AWS **trial** account: service stops when credits run out. Stop the instance to save credits; Start may **change the public IP**.

## 12. CI

`.github/workflows/ci.yml` — backend lint/typecheck/test, frontend lint/typecheck, audit. Triggers: PR/push to **`main`**. Work on `dev-hieu` does not run CI until a PR targets `main`.

## 13. Next work (do not skip ahead)

1. Persist JWT (SecureStore).
2. Transaction history (list/edit/delete/filter).
3. Categories UI.
4. Real insights (Explore is mock).
5. Register `AppController` on `AppModule` if `/health` is needed.
6. Commit/push Dockerfile + migrations (deploy is still a manual copy).

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

## 15. Expo

Read `frontend/AGENTS.md` and Expo SDK 57 docs before changing native/UI code.

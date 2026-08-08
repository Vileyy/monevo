# 💰 Monevo

> **Know where your money goes. Build where your money goes next.**

**Monevo** is a modern personal finance application designed to help people understand, track, and improve their everyday financial habits.

Instead of simply recording expenses, Monevo aims to become a practical daily finance companion — helping users manage transactions, budgets, wallets, and financial insights in one simple and intuitive experience.

Built as a production-oriented mobile application with a scalable backend, Monevo is designed to be used in real life and distributed through the **Google Play Store**.

---

## ✨ Features

### 💸 Expense & Income Tracking

* Record income and expenses
* Categorize transactions
* Add notes and transaction details
* View transaction history
* Search and filter transactions
* Track spending over time

### 💳 Wallet Management

* Create and manage multiple wallets
* Track wallet balances
* Support different account types
* Monitor money movement between wallets

### 🎯 Budget Management

* Create monthly budgets
* Set spending limits by category
* Monitor budget progress
* Receive warnings when approaching limits
* Track exceeded budgets

### 📊 Financial Insights

* Daily, weekly, and monthly summaries
* Spending breakdown by category
* Income vs. expense analysis
* Spending trends
* Financial overview dashboard

### 🔔 Smart Notifications

* Budget limit warnings
* Recurring transaction reminders
* Financial activity notifications

### ☁️ Cloud Synchronization

* Secure authentication
* Sync data across devices
* Backup personal financial data
* Offline-first experience with background synchronization

---

# 🏗️ Architecture

Monevo follows a **Clean Architecture + Feature-Based Architecture** approach.

The goal is to keep business logic independent from UI and infrastructure, making the application easier to test, maintain, and scale.

```text
┌───────────────────────────────┐
│          Mobile App           │
│       React Native + TS       │
├───────────────────────────────┤
│ Presentation                  │
│  Screens / Components         │
│  Hooks / State                │
├───────────────────────────────┤
│ Domain                        │
│  Entities                     │
│  Use Cases                    │
│  Business Rules               │
├───────────────────────────────┤
│ Data                          │
│  Repositories                 │
│  API / Local DB               │
│  DTOs / Mappers               │
└───────────────┬───────────────┘
                │
                ▼
        ┌───────────────┐
        │   FastAPI     │
        │    Backend    │
        └───────┬───────┘
                │
        ┌───────┴────────┐
        ▼                ▼
   PostgreSQL          Redis
```

### Mobile Architecture

```text
apps/mobile/

src/
├── app/
├── features/
│   ├── auth/
│   ├── transactions/
│   ├── wallets/
│   ├── budgets/
│   ├── categories/
│   └── statistics/
├── components/
├── core/
├── services/
├── store/
└── shared/
```

Each feature owns its UI, domain logic, data access, and related components where appropriate.

---

# 🛠️ Tech Stack

## Mobile

| Technology     | Purpose                             |
| -------------- | ----------------------------------- |
| React Native   | Cross-platform mobile application   |
| Expo           | Development, build, and deployment  |
| TypeScript     | Type-safe development               |
| Expo Router    | Application navigation              |
| Zustand        | Client-side state management        |
| TanStack Query | Server state & API synchronization  |
| Axios          | HTTP client                         |
| SQLite         | Local persistence / offline support |

## Backend

| Technology | Purpose                       |
| ---------- | ----------------------------- |
| FastAPI    | REST API                      |
| Python     | Backend language              |
| SQLAlchemy | ORM                           |
| Alembic    | Database migrations           |
| PostgreSQL | Primary database              |
| Redis      | Cache & background processing |
| Pydantic   | Validation & schemas          |
| JWT        | Authentication                |

## Infrastructure

| Technology     | Purpose              |
| -------------- | -------------------- |
| Docker         | Containerization     |
| Docker Compose | Local development    |
| AWS            | Cloud infrastructure |
| GitHub Actions | CI/CD                |
| Nginx          | Reverse proxy        |
| Let's Encrypt  | HTTPS                |

## Development

| Tool     | Purpose                        |
| -------- | ------------------------------ |
| Git      | Version control                |
| GitHub   | Source control & collaboration |
| Postman  | API testing                    |
| ESLint   | Code quality                   |
| Prettier | Code formatting                |
| Pytest   | Backend testing                |
| Jest     | Mobile testing                 |

---

# 📁 Project Structure

```text
monevo/
│
├── apps/
│   ├── mobile/              # React Native application
│   └── api/                 # FastAPI backend
│
├── docs/
│   ├── architecture/        # Architecture documentation
│   ├── api/                 # API documentation
│   ├── database/            # Database design
│   └── decisions/           # Technical decisions
│
├── .github/
│   └── workflows/           # CI/CD pipelines
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

Make sure you have the following installed:

* Node.js
* pnpm
* Python
* uv
* Docker
* Docker Compose
* Git

---

## 1. Clone the repository

```bash
git clone <repository-url>
cd monevo
```

---

## 2. Start infrastructure

```bash
docker compose up -d
```

This starts the required development services such as:

```text
PostgreSQL
Redis
```

---

## 3. Start the backend

```bash
cd apps/api
uv sync
```

Run the development server:

```bash
uv run uvicorn app.main:app --reload
```

API:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
```

---

## 4. Start the mobile application

```bash
cd apps/mobile
pnpm install
pnpm start
```

Then run the application using Expo on:

* Android Emulator
* Physical Android device

---

# 🧪 Testing

Monevo follows a testing strategy designed for production applications.

### Backend

```bash
uv run pytest
```

### Mobile

```bash
pnpm test
```

### Type checking

```bash
pnpm typecheck
```

### Linting

```bash
pnpm lint
```

---

# 🔄 Development Workflow

Monevo follows a feature-oriented development workflow.

```text
Requirement
     ↓
Technical Design
     ↓
Task / Ticket
     ↓
Implementation
     ↓
Unit Tests
     ↓
Integration Tests
     ↓
Code Review
     ↓
CI
     ↓
Merge
```

Every feature should have clearly defined:

* Requirements
* Acceptance Criteria
* Technical Design
* Definition of Done

---

# 🌿 Git Workflow

We use short-lived feature branches.

```text
main
 │
 ├── feature/auth
 ├── feature/transactions
 ├── feature/budgets
 └── fix/transaction-sync
```

Example:

```bash
git checkout -b feature/auth
```

Commit messages should follow a consistent convention:

```text
feat: add transaction creation
fix: prevent duplicate transactions
refactor: simplify wallet repository
test: add budget service tests
docs: update architecture documentation
chore: configure CI pipeline
```

---

# 🗺️ Roadmap

## Phase 1 — Foundation

* [ ] Project setup
* [ ] Mobile architecture
* [ ] Backend architecture
* [ ] PostgreSQL setup
* [ ] Redis setup
* [ ] Docker environment
* [ ] Authentication
* [ ] CI pipeline

## Phase 2 — Core Finance

* [ ] User profile
* [ ] Categories
* [ ] Wallets
* [ ] Income transactions
* [ ] Expense transactions
* [ ] Transaction history
* [ ] Search & filtering

## Phase 3 — Financial Management

* [ ] Monthly budgets
* [ ] Budget progress
* [ ] Recurring transactions
* [ ] Wallet transfers
* [ ] Financial dashboard
* [ ] Statistics & charts

## Phase 4 — Production Features

* [ ] Offline-first support
* [ ] Data synchronization
* [ ] Push notifications
* [ ] Error tracking
* [ ] Analytics
* [ ] Performance optimization
* [ ] Security hardening

## Phase 5 — Google Play

* [ ] Production backend deployment
* [ ] Android release build
* [ ] App icon
* [ ] Splash screen
* [ ] Privacy Policy
* [ ] Terms of Service
* [ ] Store screenshots
* [ ] Store description
* [ ] Internal testing
* [ ] Closed testing
* [ ] Production release

---

# 🔐 Security

Financial data is sensitive.

Monevo is designed with security as a first-class concern.

Planned security measures include:

* Secure password hashing
* JWT-based authentication
* Secure token storage
* HTTPS in production
* Input validation
* API authorization
* Database access controls
* Environment-based secrets
* Protection against common API vulnerabilities
* Secure local data persistence

Sensitive credentials and environment variables must never be committed to Git.

---

# 📊 Product Principles

Monevo is built around several principles:

### Simple

Managing money should not feel like managing a spreadsheet.

### Fast

Recording an expense should take only a few seconds.

### Useful

Every feature should provide a meaningful benefit to the user.

### Private

Financial information belongs to the user.

### Reliable

User data must remain consistent across devices and network conditions.

### Scalable

The architecture should allow the product to evolve without unnecessary rewrites.

---

# 🎯 Long-Term Vision

Monevo starts as a personal expense tracker, but the long-term goal is to evolve into a complete personal finance platform.

Potential future capabilities include:

* Intelligent expense categorization
* Receipt scanning
* Financial goals
* Subscription tracking
* Recurring payment detection
* Advanced financial analytics
* Personalized spending insights
* Multi-currency support
* Exportable financial reports
* Family/shared finance management

The focus remains the same:

> **Make personal finance easier to understand, easier to manage, and easier to improve.**

---

# 📱 Platform

**Current target:** Android

**Distribution:** Google Play Store

Future platform support may include:

* iOS
* Web

---

# 📄 License

This project is currently maintained as a personal software project.

License information will be added before the public release.

---

# 👨‍💻 Development

Monevo is developed as a production-oriented software engineering project with a focus on:

* Mobile development
* Backend engineering
* Software architecture
* API design
* Database design
* Testing
* CI/CD
* Cloud infrastructure
* Performance
* Security
* Product development

---

<p align="center">
  Built with ❤️ and clean architecture.
</p>

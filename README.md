# Hybrid HRIS

## Project Overview

Hybrid HRIS is a modular, enterprise-oriented Human Resource Information System designed for hybrid deployment:

- **Standalone runtime** (PM2 / containerized Node)
- **Serverless runtime** (AWS Lambda + EventBridge)

The system focuses on deterministic background processing, clean domain separation, and database-level integrity enforcement.

### Core Modules

- **Employee Management** – Master records, employment type, status, organizational assignment
- **Organizational Structure** – Departments and positions with relational integrity
- **Identity & RBAC** – Users, roles, and user-role mappings with soft deletion support
- **Leave Management (Ledger-Based)** – Accrual, consumption, and adjustment tracking using an append-only ledger model
- **Database-Sealed Constraints** – Critical business rules enforced at DB level (uniqueness, sign validation, idempotent accrual keys)

### Design Philosophy

- Append-only financial-style ledger for leave balances
- Idempotent background jobs (safe for retries in Lambda or queue workers)
- Soft deletion across core entities (except immutable ledger)
- Case-insensitive identity enforcement at database level
- Monorepo architecture with strict package boundaries

---

Hybrid-deployable Human Resource Information System (HRIS) built with a TypeScript monorepo architecture.

## Tech Stack

- **Frontend:** Next.js (App Router) – `apps/web`
- **API:** NestJS – `apps/api`
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM – `packages/db`
- **Domain Layer:** `packages/domain`
- **Package Manager:** pnpm (workspace)

---

## Monorepo Structure

```
hybrid-hris/
  apps/
    web/        # Next.js frontend
    api/        # NestJS backend
  packages/
    db/         # Drizzle schema & DB connection
    domain/     # Pure business logic layer
```

---

## Development Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Build Shared Packages

```bash
pnpm --filter @hybrid-hris/db run build
pnpm --filter @hybrid-hris/domain run build
```

### 3. Start API (NestJS)

```bash
pnpm --filter api start:dev
```

Default:

```
http://localhost:4000
```

### 4. Start Web (Next.js)

```bash
pnpm --filter web dev
```

Default:

```
http://localhost:3000
```

---

## Build All Projects

```bash
pnpm -r run build
```

---

## Type Checking

Per app:

```bash
pnpm --filter api exec tsc --noEmit
pnpm --filter web exec tsc --noEmit
```

---

## Architecture Principles

- Shared packages compile independently
- Apps consume compiled package output
- No cross-project TypeScript source compilation
- Workspace linking via `workspace:*`
- Clean separation between:
  - Application layer (Nest / Next)
  - Domain layer
  - Infrastructure layer (DB)

---

## Database Setup & Reset

### Start PostgreSQL (Docker)

```bash
docker compose up -d
```

### Recreate Database (Full Reset)

This will remove the container and volume:

```bash
docker compose down -v
```

Then start fresh:

```bash
docker compose up -d
```

### Enable Required Extensions

```bash
docker exec -it hris-postgres psql -U hris -d hris_db
```

Inside psql:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
\q
```

### Generate Migrations

```bash
pnpm --filter @hybrid-hris/db db:generate
```

### Apply Migrations

```bash
pnpm --filter @hybrid-hris/db db:migrate
```

### Seed System Data

```bash
pnpm --filter @hybrid-hris/db seed
```

---

## Next Steps

- Implement Employee module
- Implement Organizational structure
- Add Leave ledger-based accrual engine
- Add RBAC and audit logging
- Add background job orchestration (BullMQ / Lambda hybrid)

---

## License

Private / Internal Project
# Hybrid HRIS

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

## Next Steps

- Implement Employee module
- Implement Organizational structure
- Add Leave ledger-based accrual engine
- Add RBAC and audit logging
- Add background job orchestration (BullMQ / Lambda hybrid)

---

## License

Private / Internal Project
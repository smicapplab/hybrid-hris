# Hybrid HRIS

## Project Overview

Hybrid HRIS is a modular, enterprise-oriented Human Resource Information System designed for hybrid deployment:

- **Standalone runtime** (PM2 / containerized Node)
- **Serverless runtime** (AWS Lambda + EventBridge)

The system focuses on deterministic background processing, clean domain separation, and database-level integrity enforcement.

### Core Modules

- **Employee Management** – Master records, employment type, status, and organizational assignment.
- **Organizational Structure** – Hierarchical Org Units (multi-level), shared Positions, OrgUnit-Position mapping, and Org Unit Leaders (HEAD / CO_HEAD / ACTING_HEAD).
- **Leave Management (Ledger-Based)** – Robust leave tracking using an append-only financial-style ledger. Supports accrual, consumption, and manual adjustments.
- **Leave Policies & Rules** – Flexible policy engine supporting Monthly Accrual, Annual Grants, Max Balance caps, and Carry-over limits.
- **Attendance & Shift Management** – Shift templates, employee shift assignments (flexible/fixed), and attendance logging.
- **Identity & RBAC** – Users, roles, and user-role mappings with soft deletion support.
- **Database-Sealed Constraints** – Critical business rules enforced at the DB level (uniqueness, exclusion constraints for temporal integrity, and idempotent accrual keys).

### Design Philosophy

- **Immutable Ledger:** Leave balances are derived from an append-only ledger, ensuring a perfect audit trail.
- **Idempotent Accruals:** Monthly accruals use deterministic keys to prevent duplicate credits, even if a job is retried.
- **Temporal Integrity:** Policy assignments and shift assignments use Postgres `EXCLUDE` constraints to prevent overlapping records for the same employee.
- **Case-Insensitive Identity:** Identity enforcement (emails, codes) is handled at the database level for maximum reliability.
- **Monorepo Architecture:** Clean package boundaries with shared domain logic.

---

## Tech Stack

- **Frontend:** Next.js 15 (App Router) – `apps/web`
- **API:** NestJS 11 – `apps/api`
- **Database:** PostgreSQL (with `btree_gist` and `pgcrypto` extensions)
- **ORM:** Drizzle ORM – `packages/db`
- **Domain Layer:** `packages/domain` (Shared enums, types, and logic)
- **Package Manager:** pnpm (workspace)

---

## Monorepo Structure

```
hybrid-hris/
  apps/
    web/        # Next.js frontend
    api/        # NestJS backend
  packages/
    db/         # Drizzle schema, migrations & seed scripts
    domain/     # Pure business logic, enums & shared types
  scripts/      # DevOps and maintenance scripts
```

---

## Development Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Configuration

Copy `.env.sample` to `.env` in the root and in `apps/api`.

### 3. Build Shared Packages

```bash
pnpm --filter @hybrid-hris/db run build
pnpm --filter @hybrid-hris/domain run build
```

### 4. Database Setup

Ensure Docker is running, then use the reset script for a fresh start:

```bash
./scripts/reset-db.sh
```

Alternatively, to load the full testing environment (15+ employees, org tree, and leave history):

```bash
LOAD_TEST_DATA=true pnpm --filter @hybrid-hris/db seed
```

### 5. Start Applications

**API (NestJS):**
```bash
pnpm --filter api start:dev # Runs on http://localhost:4000
```

**Web (Next.js):**
```bash
pnpm --filter web dev # Runs on http://localhost:3000
```

---

## Authentication

The system uses JWT-based authentication with **Refresh Token Rotation**.

- **Access Token:** Short-lived (15m default), stored in memory/header.
- **Refresh Token:** Long-lived (7d default), stored in an `httpOnly` cookie.
- **RBAC:** Roles are embedded in the JWT and verified via `RolesGuard` in the API.

### Default Admin (Development)

Email: `admin@hybrid-hris.local`  
Password: `Admin123!`

---

## Management Features

### Leave Policy Management
Administrators can define different leave policies (e.g., Standard, Intern) and assign them to employees.
- **Process Accruals:** A dedicated UI tool allows admins to trigger monthly leave credits for the entire organization or specific months.
- **Employee Table:** View and manage all employees assigned to a specific policy directly from the policy detail panel.

### Employee Management
- Full lifecycle management from Probation to Regular/Resigned.
- Dynamic supervisor assignment for approval hierarchies.
- Identity and Government ID tracking (PH-centric: TIN, SSS, PhilHealth, Pag-IBIG).

---

## Next Steps

- [ ] Implement approval → ledger transactional integration.
- [ ] Add hybrid background job execution (BullMQ for standalone / EventBridge for serverless).
- [ ] Finalize attendance compute engine (late/undertime/overtime calculation).
- [ ] Implement payroll export module.

---

## License

Private / Internal Project

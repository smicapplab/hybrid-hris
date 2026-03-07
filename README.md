# Hybrid HRIS

## Project Overview

Hybrid HRIS is a modular, enterprise-oriented Human Resource Information System designed for hybrid deployment:

- **Standalone runtime** (PM2 / containerized Node)
- **Serverless runtime** (AWS Lambda + EventBridge)

The system focuses on deterministic background processing, clean domain separation, and database-level integrity enforcement.

### 🌐 Live Demo

**Url:** [https://hybrid-hris-web.vercel.app](https://hybrid-hris-web.vercel.app)  
**Email:** `admin@hybrid-hris.local`  
**Password:** `Admin123!`

### Core Modules

- **Employee Management** – Master records, employment type, status, and organizational assignment.
- **Organizational Structure** – Hierarchical Org Units (multi-level), shared Positions, OrgUnit-Position mapping, and Org Unit Leaders (HEAD / CO_HEAD / ACTING_HEAD).
- **Leave Management (Ledger-Based)** – Robust leave tracking using an append-only financial-style ledger. Supports accrual, consumption, and manual adjustments.
- **Leave Policies & Rules** – Flexible policy engine supporting Monthly Accrual, Annual Grants, Max Balance caps, and Carry-over limits.
- **Expense & Team Budgets** – Hierarchical budget allocation per Org Unit and category. Append-only budget ledger for consumption tracking.
- **Attendance & Shift Management** – Shift templates, employee shift assignments (flexible/fixed), and attendance logging.
- **Identity & RBAC** – Users, roles, and user-role mappings with hardened database-first authorization.

### Design Philosophy

- **Immutable Ledgers:** Both Leave and Budget balances are derived from append-only ledgers, ensuring a perfect audit trail and preventing data corruption.
- **Database-First Authorization:** Security is enforced at the service level by re-fetching user roles and leadership status directly from the database, preventing "stale" token access.
- **Deterministic Accruals:** Monthly accruals use idempotent deterministic keys to prevent duplicate credits during retries or job restarts.
- **Temporal Integrity:** Policy and shift assignments use Postgres `EXCLUDE` constraints to prevent overlapping records for the same employee.
- **Monorepo Architecture:** Clean package boundaries with shared domain logic between frontend and backend.

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

Alternatively, to load the full testing environment (15+ employees, org tree, leave history, and team budgets):

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

## Authentication & Security

The system uses JWT-based authentication with **Refresh Token Rotation**.

- **Access Token:** Short-lived (15m default), stored in memory/header.
- **Refresh Token:** Long-lived (7d default), stored in an `httpOnly` cookie.
- **RBAC:** Roles are verified via `RolesGuard` in the API. 
- **Security Hardening:** Critical data visibility (Approvals, Budgets) is scoped using live database lookups of user roles and leadership assignments rather than trusting JWT claims.

### Default Admin (Development)

Email: `admin@hybrid-hris.local`  
Password: `Admin123!`

---

## Management Features

### Leave Policy Management
Administrators can define different leave policies (e.g., Standard, Intern) and assign them to employees.
- **Process Accruals:** A dedicated UI tool allows admins to trigger monthly leave credits organization-wide.
- **Employee Visibility:** View all employees assigned to a specific policy directly from the policy dashboard.

### Expense & Budget Matrix
- **Budget Matrix:** Global view of allocations across all Organizational Units and Expense Categories (Travel, Meals, Hardware, etc.).
- **Expense Filing:** Employees can file claims directly against their team's budget with real-time remaining balance checks.
- **Approval Workflow:** Hierarchical approval (Supervisor -> Org Head -> Finance) with automated ledger consumption.

### Employee Lifecycle
- Full management from Probation to Regular/Resigned.
- Dynamic supervisor assignment and organizational mapping.
- Tracking of Government IDs (PH-centric: TIN, SSS, PhilHealth, Pag-IBIG).

---

## Next Steps

- [ ] Add Receipt File Upload support (S3/Local strategy).
- [ ] Implement multi-level approval logic for Leaves (currently single-level).
- [ ] Add hybrid background job execution (BullMQ + Lambda/EventBridge).
- [ ] Finalize attendance compute engine (late/undertime/overtime calculation).

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

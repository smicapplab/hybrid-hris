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
- **Organizational Structure** – Hierarchical Org Units (3-level depth), shared Positions, and Org Unit Leaders (HEAD / CO_HEAD / ACTING_HEAD).
- **Manpower Request Workflow** – Formalized hiring requests with multi-level approval (HR Admin → Root Leader).
- **Plantilla & Headcount Inventory** – Real-time tracking of authorized vs. filled vs. vacant slots across the entire organization.
- **Leave Management (Ledger-Based)** – Robust leave tracking using an append-only financial-style ledger. Supports accrual, consumption, and manual adjustments.
- **Expense & Team Budgets** – Hierarchical budget allocation per Org Unit and category. Append-only budget ledger for consumption tracking.
- **Attendance & Shift Management** – Shift templates, employee shift assignments, and attendance logging with 30-day historical tracking.
- **Identity & RBAC** – Users, roles, and user-role mappings with hardened database-first authorization.
- **Skills & Training Management** – Centralized skill taxonomy, 360-degree employee skill profiles, and internal/external training programs with automated skill granting.

### Design Philosophy

- **Immutable Ledgers:** Both Leave and Budget balances are derived from append-only ledgers, ensuring a perfect audit trail.
- **Real-time Plantilla Integrity:** Authorized headcount limits are strictly enforced; expansion is only possible through approved "New Headcount" workflows.
- **Database-First Authorization:** Security is enforced at the service level by re-fetching user roles and leadership status directly from the database.
- **Deterministic Accruals:** Monthly accruals use idempotent deterministic keys to prevent duplicate credits.
- **Monorepo Architecture:** Clean package boundaries using pnpm workspaces.

---

## Tech Stack

- **Frontend:** Next.js 15 (App Router) – `apps/web`
- **API:** NestJS 11 – `apps/api`
- **Database:** PostgreSQL (Drizzle ORM) – `packages/db`
- **Rich Text:** Tiptap (WYSIWYG) for job postings
- **Domain Layer:** `packages/domain` (Shared business logic & enums)
- **Data Mocking:** Faker.js for enterprise-grade seeding

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
pnpm --filter "@hybrid-hris/*" run build
```

### 4. Database Setup

Ensure Docker is running, then run migrations and seed the **Enterprise Environment**:

```bash
pnpm --filter @hybrid-hris/db run db:migrate
LOAD_TEST_DATA=true pnpm --filter @hybrid-hris/db run seed
```
*The seed generates ~90 realistic employees, a 3-level org tree, 30 days of attendance, and full budget/leave history.*

### 5. Start Applications

**API:** `pnpm --filter api start:dev` (http://localhost:4000)  
**Web:** `pnpm --filter web dev` (http://localhost:3000)

---

## Management Features

### Recruitment & Plantilla
- **Operational Vacancy Detection:** Managers can see "Available" slots in their Org Unit and trigger hiring requests directly from the Org Structure view.
- **Approval Workflow:** Strict **HR Admin → Root Leader** chain for all recruitment needs.
- **Automated Headcount Expansion:** Final approval of a "New Headcount" request automatically increments the authorized Plantilla limit for that unit.
- **Rich Text Job Postings:** Integrated WYSIWYG editor for drafting professional job descriptions (Summary, Responsibilities, Qualifications) compatible with external boards like LinkedIn.

### Leave & Accrual
- **Policy Engine:** Define different leave policies (e.g., Standard, Intern) with specific monthly accrual rates and carry-over limits.
- **Process Accruals:** Trigger organization-wide monthly credits with a single click.

### Expense & Budget Matrix
- **Budget Matrix:** Global view of allocations across all Organizational Units and Categories.
- **Real-time Consumption:** Expense filing includes immediate balance validation against the team's allocated budget.

### Employee Lifecycle
- PH-centric tracking (TIN, SSS, PhilHealth, Pag-IBIG).
- Full movement tracking from Probation to Regular/Resigned.

### Skills & Professional Development
- **Skill Taxonomy:** HR-managed global catalog of skills categorized by domain (e.g., Programming, Leadership) with support for expiration and recertification.
- **360 Skill Profiles:** Employees maintain verified skill inventories sourced from internal training, external experience, or manager assignments.
- **Trust Hierarchy:** Automated verification for "Internal Training" skills, manager-verified "Assigned" skills, and pending "Self-Claimed" skills.
- **Training Lifecycle:** Manage reusable Training Programs (templates) and multiple Schedules (instances) with capacity tracking and automated attendance-to-skill workflows.
- **Skill Gap Heatmaps (Planned):** Compare employee proficiency levels against Position-specific requirements to identify organizational capabilities and training needs.

---

## Next Steps

- [ ] Add Receipt File Upload support (S3/Local strategy).
- [ ] Implement multi-level approval logic for Leaves (currently single-level).
- [ ] Add hybrid background job execution (BullMQ + Lambda/EventBridge).
- [ ] Integrate external Job Boards API (LinkedIn/Indeed/Jobstreet).

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

# Hybrid HRIS

## Project Overview

Hybrid HRIS is a high-performance, modular Human Resource Information System designed for hybrid deployment. It supports standalone containerized environments and serverless architectures like AWS Lambda. The system prioritizes domain-driven design, database-level integrity, and hierarchical authority models.

### Live Demo

- **URL:** [https://hybrid-hris-web.vercel.app](https://hybrid-hris-web.vercel.app)  
- **Admin Access:** `admin@hybrid-hris.local` / `Admin123!`

## System Architecture

The project uses a monorepo structure managed with PNPM Workspaces for strict type safety and code reuse.

### Applications
- **apps/api (NestJS 11):** RESTful API with hardened RBAC, Passport-based authentication, and Drizzle ORM.
- **apps/web (Next.js 16 + Turbopack):** Responsive dashboard built with App Router, Shadcn UI, and Tailwind CSS.

### Shared Packages
- **packages/db:** Single source of truth for database schema and migrations using Drizzle ORM.
- **packages/domain:** Shared TypeScript interfaces, enums, and constants.

## Core Modules

### Organizational Intelligence
- **Hierarchical Org Tree:** Managed through Org Units with recursive leadership models.
- **Recursive Authority:** Powered by PostgreSQL Recursive CTEs for automatic authority inheritance.
- **Plantilla and Headcount:** Real-time tracking of authorized slots and manpower requests.

### Schedule and Attendance (New)
- **Advanced Schedule Management:** HR can define global shift templates and assign them to employees.
- **Future-Dated Shifts:** Support for queuing upcoming schedule changes that take effect automatically.
- **Auto-Promotion:** Pending shifts are automatically applied to the active record when an employee records attendance.
- **Attendance History:** Detailed tracking of time-in, time-out, and total hours with shift matching.

### Skills and Training
- **3-Layer Mandatory Training:** Define requirements at Global, Position, and Org Unit levels.
- **Compliance Tracking:** Real-time monitoring of missing, scheduled, and completed requirements.
- **Automated Skill Granting:** Successful training completion automatically updates employee profiles.

### Leave and Expenses
- **Ledger-Based Accruals:** Financial-style transaction logging for all leave credits and debits.
- **Hierarchical Approvals:** Multi-level approval workflows for overtime, leave, and expenses.
- **Zero-Trust Budgets:** Real-time validation of expense claims against available budget ledgers.

## Tech Stack

- **Frontend:** Next.js 16, Tailwind CSS, Shadcn UI, Lucide Icons
- **Backend:** NestJS 11, Node.js 22, Drizzle ORM
- **Database:** PostgreSQL
- **DevOps:** Docker, PNPM Workspaces

## Getting Started

### 1. Installation
```bash
pnpm install
```

### 2. Environment Setup
Copy `.env.sample` to `.env` in the root directory and `apps/api`.

### 3. Database Initialization
```bash
docker-compose up -d
pnpm build:shared
pnpm --filter @hybrid-hris/db run db:migrate
LOAD_TEST_DATA=true pnpm --filter @hybrid-hris/db run seed
```

### 4. Running the Apps
```bash
pnpm --filter api start:dev
pnpm --filter web dev
```

## Performance and Optimizations

- **Database Performance:** Strategic indexing across all high-traffic tables including audit logs, employees, and attendance.
- **Parallel Data Fetching:** Concurrent API calls for complex views to reduce latency.
- **Tabbed Interface:** Refactored employee profiles for better information organization and faster loading.
- **Type-Safe Component Architecture:** Reusable UI components with strict prop typing and error handling.

## Roadmap

### Recently Completed
- **Schedule Management System:** Shift templates, pending shifts, and auto-promotion logic.
- **Database Optimization:** Comprehensive indexing strategy for enterprise-scale data.
- **Employee Profile Refactor:** Improved UX with tabbed navigation and integrated attendance history.
- **System Audit Logs:** Global traceability for all sensitive data mutations.

### Future Enhancements
- **Payroll and Compensation:** Base pay tracking and government-mandated deductions.
- **Performance Management:** Annual review cycles and KPI/OKR tracking.
- **Notification Engine:** In-app and email alerts for pending actions.
- **Advanced Analytics:** Organizational risk heatmaps and skill density reports.

## License

This project is licensed under the MIT License.

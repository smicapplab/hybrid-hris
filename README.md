# Hybrid HRIS 🚀

## Project Overview

Hybrid HRIS is a high-performance, modular, and enterprise-grade Human Resource Information System. It is architected for **hybrid deployment**, allowing it to run as a standalone containerized application or within serverless environments (AWS Lambda).

The system is built with a heavy focus on **domain-driven design**, **database-level integrity**, and **hierarchical authority models**. It solves complex HR challenges like recursive leadership oversight, immutable audit trails for finance-related modules (Leave/Budget), and automated professional development pipelines.

### 🌐 Live Demo

**URL:** [https://hybrid-hris-web.vercel.app](https://hybrid-hris-web.vercel.app)  
**Admin Access:** `admin@hybrid-hris.local` / `Admin123!`

---

## 🏗 System Architecture

The project is managed as a **Monorepo** using PNPM Workspaces, ensuring strict type safety and code reuse across the stack.

### Applications
- **`apps/api` (NestJS 11):** A robust RESTful API featuring hardened RBAC, Passport-based authentication, and optimized database queries using Drizzle ORM.
- **`apps/web` (Next.js 16 + Turbopack):** A modern, responsive dashboard built with the App Router, Shadcn UI, and Tailwind CSS. It features a rich, interactive UI with real-time feedback.

### Shared Packages
- **`packages/db`:** The single source of truth for the database schema, migrations, and enterprise-grade seed scripts using Drizzle ORM.
- **`packages/domain`:** Shared TypeScript interfaces, enums, and business logic constants used by both frontend and backend.

---

## ✨ Core Modules & Features

### 🏢 Organizational Intelligence
- **Hierarchical Org Tree:** Managed through Org Units with recursive leadership models.
- **Recursive Authority:** Powered by **PostgreSQL Recursive CTEs**, allowing leaders to automatically inherit authority and visibility over their entire downline.
- **Plantilla & Headcount:** Real-time tracking of authorized slots. Expansion requires formalized Manpower Requests and multi-level approvals.

### 🎓 Skills & Training (New!)
- **3-Layer Mandatory Training:** HR can define requirements at the **Global**, **Position**, and **Org Unit** levels.
- **Three-State Compliance:** Actionable tracking that distinguishes between:
  - 🔴 **Missing:** No completion and NO upcoming enrollment (Needs Action).
  - 🟡 **Scheduled:** Enrolled in a future session (Action Taken).
  - 🟢 **Completed:** Requirement fulfilled.
- **Training Feedback System:** Employees can rate sessions (1-5 stars) and provide comments upon completion. HR can monitor these via a global **Feedback Analytics** dashboard.
- **Automated Skill Granting:** Successful training completion automatically updates employee profiles with verified skills.
- **HR Global View:** HR Admins can toggle between their immediate team and the **Entire Organization** scope across all managerial dashboards.

### 📅 Attendance & Leave
- **Ledger-Based Accruals:** Every leave credit/debit is a financial-style transaction. No "floating" balances; every minute is accounted for.
- **Shift Management:** Flexible shift templates with localized timezone support.
- **Real-time Attendance:** Bio-metric ready attendance logging with automatic shift matching.

### 💰 Expense & Budgeting
- **Hierarchical Budgets:** Allocations are set per Org Unit and Category.
- **Zero-Trust Validation:** Expenses are validated in real-time against the available budget ledger before submission.

---

## 🛠 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), Turbopack, Tailwind CSS, Shadcn UI, Lucide Icons |
| **Backend** | NestJS 11, Node.js 22, Class Validator, Passport.js |
| **Database** | PostgreSQL, Drizzle ORM, Zod |
| **DevOps** | PNPM Workspaces, Docker, AWS Lambda Strategy |
| **Testing/Data** | Faker.js, Jest |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js 22+**
- **PNPM 9+**
- **Docker** (for local PostgreSQL)

### 2. Installation
```bash
pnpm install
```

### 3. Environment Setup
Copy `.env.sample` to `.env` in the following locations:
- Root directory
- `apps/api`

### 4. Database Initialization
```bash
# Start PostgreSQL (if using docker-compose)
docker-compose up -d

# Build shared packages first
pnpm build:shared

# Run migrations and seed the data
pnpm --filter @hybrid-hris/db run db:migrate
LOAD_TEST_DATA=true pnpm --filter @hybrid-hris/db run seed
```
*Note: The seed script generates ~100 realistic employees, a 3-level org structure, and full training/skills history.*

### 5. Running the Apps
```bash
# Start API (Port 4000)
pnpm --filter api start:dev

# Start Web (Port 3000)
pnpm --filter web dev
```

---

## 📈 Performance & Optimizations

- **Parallelized Data Fetching:** Complex views like the **Talent Card** use `Promise.all` to fetch skills, training, leaves, and schedules concurrently, reducing API latency by ~60%.
- **Efficient Joins:** Combined mandatory training checks into single-pass SQL queries to avoid N+1 issues.
- **Type-Safe Errors:** Standardized `(err: unknown)` pattern with descriptive toast notifications across the entire frontend.
- **Smart Refresh:** Automatic UI data invalidation after key actions (like enrolling a student) to ensure state consistency without full page reloads.

---

## 🗺 Roadmap

### 🎯 Completed Recently
- [x] **System Audit Logs (#6):** Global traceability for every sensitive change (who, what, when, old vs new values).
- [x] **Time & Attendance Refinement (#2):** Formalized Overtime (OT) workflows, Holiday Calendar management, and shift differential logic.

### 🚀 Future Enhancements
- [ ] **Payroll & Compensation:** Base pay tracking, government-mandated deductions (PH context), and immutable salary history.
- [ ] **Performance Management:** Annual review cycles, KPI/OKR tracking, and 360-degree feedback loops.
- [ ] **Notification Engine:** In-app, Email, and Slack alerts for pending approvals and critical events.
- [ ] **Digital 201 File:** Secure document vault for contracts, IDs, and government forms.
- [ ] **Advanced Analytics:** Company-wide skill density reports and organizational risk analysis heatmaps.
- [ ] **Job Board API:** Direct posting to LinkedIn and Jobstreet from the Recruitment module.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

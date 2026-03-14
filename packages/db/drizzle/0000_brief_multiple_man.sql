CREATE TYPE "public"."holiday_type" AS ENUM('REGULAR', 'SPECIAL');--> statement-breakpoint
CREATE TYPE "public"."overtime_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."overtime_type" AS ENUM('REGULAR_OT', 'REST_DAY_OT', 'HOLIDAY_OT');--> statement-breakpoint
CREATE TYPE "public"."proficiency_level" AS ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');--> statement-breakpoint
CREATE TYPE "public"."skill_source" AS ENUM('INTERNAL_TRAINING', 'EXTERNAL_EXPERIENCE', 'MANAGER_ASSIGNED');--> statement-breakpoint
CREATE TYPE "public"."skill_verification_status" AS ENUM('PENDING', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."training_enrollment_status" AS ENUM('ENROLLED', 'COMPLETED', 'CANCELLED', 'WAITLISTED', 'DID_NOT_ATTEND');--> statement-breakpoint
CREATE TYPE "public"."training_schedule_status" AS ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."training_type" AS ENUM('INTERNAL', 'EXTERNAL');--> statement-breakpoint
CREATE TYPE "public"."employee_status" AS ENUM('ACTIVE', 'PROBATION', 'SUSPENDED', 'RESIGNED', 'TERMINATED');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('REGULAR', 'PROBATIONARY', 'CONTRACTUAL', 'CONSULTANT', 'INTERN');--> statement-breakpoint
CREATE TYPE "public"."civil_status" AS ENUM('SINGLE', 'MARRIED', 'SEPARATED', 'WIDOWED', 'ANNULLED');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY');--> statement-breakpoint
CREATE TYPE "public"."auth_provider" AS ENUM('GOOGLE', 'MICROSOFT');--> statement-breakpoint
CREATE TYPE "public"."org_unit_leader_role" AS ENUM('HEAD', 'CO_HEAD', 'ACTING_HEAD');--> statement-breakpoint
CREATE TYPE "public"."accrual_method" AS ENUM('MONTHLY', 'ANNUAL_GRANT', 'NONE');--> statement-breakpoint
CREATE TYPE "public"."leave_day_type" AS ENUM('FULL', 'HALF');--> statement-breakpoint
CREATE TYPE "public"."leave_request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."leave_approval_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."leave_ledger_entry_type" AS ENUM('ACCRUAL', 'CONSUMPTION', 'ADJUSTMENT');--> statement-breakpoint
CREATE TYPE "public"."pending_shift_status" AS ENUM('PENDING', 'APPLIED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."attendance_source" AS ENUM('WEB', 'MOBILE', 'KIOSK', 'API');--> statement-breakpoint
CREATE TYPE "public"."attendance_adjustment_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."budget_period_type" AS ENUM('MONTHLY', 'QUARTERLY', 'ANNUAL');--> statement-breakpoint
CREATE TYPE "public"."expense_claim_status" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'REIMBURSED');--> statement-breakpoint
CREATE TYPE "public"."expense_approval_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."budget_ledger_entry_type" AS ENUM('ALLOCATION', 'CONSUMPTION', 'ADJUSTMENT', 'REVERSAL', 'RESERVATION', 'RELEASE');--> statement-breakpoint
CREATE TYPE "public"."manpower_request_status" AS ENUM('DRAFT', 'SUBMITTED', 'SUBMITTED_TO_ROOT', 'APPROVED', 'REJECTED', 'CANCELLED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."manpower_request_type" AS ENUM('NEW_HEADCOUNT', 'REPLACEMENT', 'PROJECT_BASED');--> statement-breakpoint
CREATE TYPE "public"."request_priority" AS ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."manpower_approval_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."job_posting_status" AS ENUM('DRAFT', 'OPEN', 'CLOSED');--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_no" varchar(50) NOT NULL,
	"first_name" varchar(120) NOT NULL,
	"last_name" varchar(120) NOT NULL,
	"middle_name" varchar(120),
	"alternate_email" varchar(320),
	"hire_date" date NOT NULL,
	"employment_type" "employment_type" DEFAULT 'REGULAR' NOT NULL,
	"employee_status" "employee_status" DEFAULT 'ACTIVE' NOT NULL,
	"address_line1" varchar(250),
	"address_line2" varchar(250),
	"city" varchar(120),
	"province" varchar(120),
	"postal_code" varchar(20),
	"country_code" varchar(10) DEFAULT 'PH' NOT NULL,
	"timezone" varchar(50),
	"org_unit_id" uuid NOT NULL,
	"position_id" uuid NOT NULL,
	"supervisor_id" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employees_supervisor_not_self_check" CHECK (supervisor_id IS NULL OR supervisor_id <> id),
	CONSTRAINT "employees_hire_date_not_future_check" CHECK (hire_date <= CURRENT_DATE)
);
--> statement-breakpoint
CREATE TABLE "employee_identifiers" (
	"employee_id" uuid PRIMARY KEY NOT NULL,
	"tin_no" varchar(32),
	"sss_no" varchar(32),
	"philhealth_no" varchar(32),
	"pagibig_no" varchar(32),
	"umid_no" varchar(32),
	"passport_no" varchar(32),
	"passport_expiry" date,
	"drivers_license_no" varchar(32),
	"drivers_license_expiry" date,
	"prc_license_no" varchar(32),
	"prc_license_expiry" date,
	"company_id_no" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_profiles" (
	"employee_id" uuid PRIMARY KEY NOT NULL,
	"birth_date" date,
	"gender" "gender",
	"civil_status" "civil_status",
	"nationality" varchar(80),
	"personal_email" varchar(320),
	"mobile_no" varchar(30),
	"landline_no" varchar(30),
	"emergency_contact_name" varchar(160),
	"emergency_contact_relationship" varchar(60),
	"emergency_contact_mobile_no" varchar(30),
	"notes" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_leave_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"policy_id" uuid NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employee_leave_policies_effective_date_order_check" CHECK ((effective_to IS NULL) OR (effective_to >= effective_from))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid,
	"email" varchar(320) NOT NULL,
	"password_hash" varchar(255),
	"attendance_pin_hash" varchar(255),
	"attendance_pin_set_at" timestamp with time zone,
	"attendance_pin_attempts" integer DEFAULT 0 NOT NULL,
	"attendance_pin_locked_until" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" varchar(500),
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "user_refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"jti" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"ip_address" varchar(64),
	"user_agent" varchar(512),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_refresh_tokens_not_expired_check" CHECK (expires_at > created_at)
);
--> statement-breakpoint
CREATE TABLE "user_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "auth_provider" NOT NULL,
	"provider_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar(50) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" varchar(255),
	"old_value" jsonb,
	"new_value" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "overtime_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"hours" numeric(4, 2) NOT NULL,
	"type" "overtime_type" DEFAULT 'REGULAR_OT' NOT NULL,
	"status" "overtime_status" DEFAULT 'PENDING' NOT NULL,
	"reason" text NOT NULL,
	"approver_id" uuid,
	"approved_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(100) NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "positions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "org_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"parent_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "org_units_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "org_unit_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_unit_id" uuid NOT NULL,
	"position_id" uuid NOT NULL,
	"headcount_limit" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "org_unit_position_unique" UNIQUE("org_unit_id","position_id")
);
--> statement-breakpoint
CREATE TABLE "org_unit_leaders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_unit_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"role" "org_unit_leader_role" NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "org_unit_leaders_unique" UNIQUE("org_unit_id","employee_id","role","effective_from"),
	CONSTRAINT "org_unit_leaders_effective_date_order_check" CHECK ((effective_to IS NULL) OR (effective_to >= effective_from))
);
--> statement-breakpoint
CREATE TABLE "holidays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"name" varchar(150) NOT NULL,
	"type" "holiday_type" DEFAULT 'REGULAR' NOT NULL,
	"country_code" varchar(10) DEFAULT 'PH' NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "leave_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" varchar(500),
	"accrual_rate_per_month" numeric(10, 4),
	"max_carry_over" numeric(10, 4),
	"is_accrual_based" boolean DEFAULT true NOT NULL,
	"is_paid" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leave_policies_effective_date_order_check" CHECK ((effective_to IS NULL) OR (effective_to >= effective_from))
);
--> statement-breakpoint
CREATE TABLE "leave_policy_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" uuid NOT NULL,
	"leave_type_id" uuid NOT NULL,
	"accrual_method" "accrual_method" NOT NULL,
	"accrual_rate_per_month" numeric(10, 4),
	"annual_grant_amount" numeric(10, 4),
	"max_balance" numeric(10, 4),
	"max_carry_over" numeric(10, 4),
	"allow_negative_balance" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leave_policy_rules_accrual_method_consistency_check" CHECK (
                (accrual_method <> 'MONTHLY' OR accrual_rate_per_month IS NOT NULL)
                AND
                (accrual_method <> 'ANNUAL_GRANT' OR annual_grant_amount IS NOT NULL)
            )
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"leave_type_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"start_day_type" "leave_day_type" DEFAULT 'FULL' NOT NULL,
	"end_day_type" "leave_day_type" DEFAULT 'FULL' NOT NULL,
	"days" numeric(10, 4) NOT NULL,
	"notes" text,
	"status" "leave_request_status" DEFAULT 'PENDING' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leave_requests_date_order_check" CHECK (end_date >= start_date),
	CONSTRAINT "leave_requests_days_positive_check" CHECK (days > 0)
);
--> statement-breakpoint
CREATE TABLE "leave_request_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"leave_request_id" uuid NOT NULL,
	"approver_user_id" uuid NOT NULL,
	"level" integer NOT NULL,
	"status" "leave_approval_status" DEFAULT 'PENDING' NOT NULL,
	"acted_at" timestamp with time zone,
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leave_request_approvals_status_acted_at_consistency_check" CHECK (
                (status = 'PENDING' AND acted_at IS NULL)
                OR
                (status <> 'PENDING' AND acted_at IS NOT NULL)
            )
);
--> statement-breakpoint
CREATE TABLE "leave_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"leave_type_id" uuid NOT NULL,
	"entry_type" "leave_ledger_entry_type" NOT NULL,
	"amount" numeric(10, 4) NOT NULL,
	"balance" numeric(12, 4) NOT NULL,
	"accrual_key" varchar(100),
	"period_start" timestamp with time zone,
	"period_end" timestamp with time zone,
	"reference_leave_request_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leave_ledger_accrual_key_required_check" CHECK ((entry_type <> 'ACCRUAL') OR (accrual_key IS NOT NULL)),
	CONSTRAINT "leave_ledger_amount_sign_check" CHECK (
        (entry_type <> 'ACCRUAL' OR amount > 0)
        AND
        (entry_type <> 'CONSUMPTION' OR amount < 0)
      ),
	CONSTRAINT "leave_ledger_period_date_order_check" CHECK (
        (period_end IS NULL OR period_start IS NULL)
        OR
        (period_end >= period_start)
      )
);
--> statement-breakpoint
CREATE TABLE "hr_settings" (
	"singleton" boolean PRIMARY KEY DEFAULT true NOT NULL,
	"employee_no_prefix" varchar(10) DEFAULT 'EMP-' NOT NULL,
	"employee_no_next" integer DEFAULT 1 NOT NULL,
	"employee_no_padding" integer DEFAULT 6 NOT NULL,
	"email_domain" varchar(253),
	"timezone" varchar(50) DEFAULT 'Asia/Manila' NOT NULL,
	"password_login_enabled" boolean DEFAULT true NOT NULL,
	"google_login_enabled" boolean DEFAULT false NOT NULL,
	"microsoft_login_enabled" boolean DEFAULT false NOT NULL,
	"allowed_workspace_domains" varchar(255)[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(150) NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"break_minutes" integer NOT NULL,
	"is_flexible" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_mon" boolean DEFAULT true NOT NULL,
	"is_tue" boolean DEFAULT true NOT NULL,
	"is_wed" boolean DEFAULT true NOT NULL,
	"is_thu" boolean DEFAULT true NOT NULL,
	"is_fri" boolean DEFAULT true NOT NULL,
	"is_sat" boolean DEFAULT false NOT NULL,
	"is_sun" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_shift_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"shift_template_id" uuid NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"break_minutes" integer NOT NULL,
	"is_flexible" boolean NOT NULL,
	"is_mon" boolean NOT NULL,
	"is_tue" boolean NOT NULL,
	"is_wed" boolean NOT NULL,
	"is_thu" boolean NOT NULL,
	"is_fri" boolean NOT NULL,
	"is_sat" boolean NOT NULL,
	"is_sun" boolean NOT NULL,
	"effective_from" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pending_employee_shift_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"shift_template_id" uuid NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"break_minutes" integer NOT NULL,
	"is_flexible" boolean NOT NULL,
	"is_mon" boolean NOT NULL,
	"is_tue" boolean NOT NULL,
	"is_wed" boolean NOT NULL,
	"is_thu" boolean NOT NULL,
	"is_fri" boolean NOT NULL,
	"is_sat" boolean NOT NULL,
	"is_sun" boolean NOT NULL,
	"effective_date" date NOT NULL,
	"status" "pending_shift_status" DEFAULT 'PENDING' NOT NULL,
	"requested_by" uuid NOT NULL,
	"applied_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"work_date" date NOT NULL,
	"scheduled_in_at" timestamp with time zone,
	"scheduled_out_at" timestamp with time zone,
	"actual_in_at" timestamp with time zone,
	"actual_out_at" timestamp with time zone,
	"total_hours" numeric(4, 2) DEFAULT '0' NOT NULL,
	"night_diff_hours" numeric(4, 2) DEFAULT '0' NOT NULL,
	"holiday_hours" numeric(4, 2) DEFAULT '0' NOT NULL,
	"overtime_hours" numeric(4, 2) DEFAULT '0' NOT NULL,
	"status" varchar(50) DEFAULT 'PRESENT' NOT NULL,
	"source_in" "attendance_source",
	"source_out" "attendance_source",
	"is_locked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"attendance_log_id" uuid,
	"work_date" date NOT NULL,
	"requested_actual_in_at" timestamp with time zone,
	"requested_actual_out_at" timestamp with time zone,
	"previous_actual_in_at" timestamp with time zone,
	"previous_actual_out_at" timestamp with time zone,
	"reason_code" integer,
	"remarks" text NOT NULL,
	"approver_remarks" text,
	"status" "attendance_adjustment_status" DEFAULT 'PENDING' NOT NULL,
	"requested_by" uuid NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_adjustments_approval_consistency_check" CHECK (status <> 'APPROVED' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "expense_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"period_type" "budget_period_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_unit_budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_unit_id" uuid NOT NULL,
	"budget_period_id" uuid NOT NULL,
	"expense_category_id" uuid NOT NULL,
	"amount_allocated" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"org_unit_id" uuid NOT NULL,
	"expense_category_id" uuid NOT NULL,
	"budget_period_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"expense_date" date NOT NULL,
	"description" varchar(500) NOT NULL,
	"status" "expense_claim_status" DEFAULT 'DRAFT' NOT NULL,
	"submitted_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"reimbursed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_claim_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expense_claim_id" uuid NOT NULL,
	"approver_user_id" uuid NOT NULL,
	"level" integer NOT NULL,
	"status" "expense_approval_status" DEFAULT 'PENDING' NOT NULL,
	"acted_at" timestamp with time zone,
	"remarks" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_unit_id" uuid NOT NULL,
	"budget_period_id" uuid NOT NULL,
	"expense_category_id" uuid NOT NULL,
	"entry_type" "budget_ledger_entry_type" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"reference_expense_claim_id" uuid,
	"reference_budget_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expense_claim_id" uuid NOT NULL,
	"file_url" varchar(500) NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manpower_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_unit_id" uuid NOT NULL,
	"position_id" uuid,
	"requested_by" uuid NOT NULL,
	"request_type" "manpower_request_type" NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"employment_type" "employment_type" NOT NULL,
	"priority" "request_priority" DEFAULT 'NORMAL' NOT NULL,
	"job_title" varchar(200) NOT NULL,
	"job_summary" text,
	"job_description" text,
	"responsibilities" text,
	"qualifications" text,
	"status" "manpower_request_status" DEFAULT 'DRAFT' NOT NULL,
	"target_hire_date" date,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manpower_request_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"manpower_request_id" uuid NOT NULL,
	"approver_user_id" uuid NOT NULL,
	"level" integer NOT NULL,
	"status" "manpower_approval_status" DEFAULT 'PENDING' NOT NULL,
	"acted_at" timestamp with time zone,
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "manpower_request_approvals_status_acted_at_consistency_check" CHECK (
                (status = 'PENDING' AND acted_at IS NULL)
                OR
                (status <> 'PENDING' AND acted_at IS NOT NULL)
            )
);
--> statement-breakpoint
CREATE TABLE "job_postings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"manpower_request_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"employment_type" "employment_type" NOT NULL,
	"location" varchar(200),
	"remote_type" varchar(50),
	"description" text NOT NULL,
	"responsibilities" text,
	"qualifications" text,
	"salary_min" numeric(12, 2),
	"salary_max" numeric(12, 2),
	"currency" varchar(3) DEFAULT 'PHP' NOT NULL,
	"status" "job_posting_status" DEFAULT 'DRAFT' NOT NULL,
	"external_sync_status" varchar(50) DEFAULT 'NOT_SYNCED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skill_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"type" varchar(50) DEFAULT 'TECHNICAL' NOT NULL,
	"description" text,
	"expiry_months" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_skill_endorsements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_skill_id" uuid NOT NULL,
	"endorser_id" uuid NOT NULL,
	"message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"training_enrollment_id" uuid,
	"proficiency_level" "proficiency_level" NOT NULL,
	"skill_source" "skill_source" NOT NULL,
	"skill_verification_status" "skill_verification_status" DEFAULT 'PENDING' NOT NULL,
	"evidence_url" varchar(2048),
	"notes" text,
	"acquired_date" date NOT NULL,
	"expiry_date" date,
	"verified_by_id" uuid,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employee_skills_employee_skill_uq" UNIQUE("employee_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "org_unit_mandatory_trainings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_unit_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "position_mandatory_trainings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"position_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_prerequisites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"prerequisite_program_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_program_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"granted_proficiency_level" "proficiency_level" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"objectives" text,
	"type" "training_type" DEFAULT 'INTERNAL' NOT NULL,
	"is_mandatory" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_schedule_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"title" varchar(255),
	"location" varchar(255),
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"status" "training_schedule_status" DEFAULT 'SCHEDULED' NOT NULL,
	"trainer_id" uuid,
	"external_trainer" varchar(255),
	"location" varchar(255),
	"capacity" integer,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"status" "training_enrollment_status" DEFAULT 'ENROLLED' NOT NULL,
	"completion_notes" text,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"processed_by_id" uuid,
	"feedback_rating" text,
	"feedback_comments" text,
	"feedback_submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "position_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"position_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"required_proficiency_level" "proficiency_level" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "position_skills_position_skill_uq" UNIQUE("position_id","skill_id")
);
--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_org_unit_id_org_units_id_fk" FOREIGN KEY ("org_unit_id") REFERENCES "public"."org_units"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_supervisor_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_identifiers" ADD CONSTRAINT "employee_identifiers_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_leave_policies" ADD CONSTRAINT "employee_leave_policies_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_leave_policies" ADD CONSTRAINT "employee_leave_policies_policy_id_leave_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."leave_policies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_refresh_tokens" ADD CONSTRAINT "user_refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_identities" ADD CONSTRAINT "user_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overtime_requests" ADD CONSTRAINT "overtime_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overtime_requests" ADD CONSTRAINT "overtime_requests_approver_id_employees_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_units" ADD CONSTRAINT "org_units_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."org_units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_unit_positions" ADD CONSTRAINT "org_unit_positions_org_unit_fk" FOREIGN KEY ("org_unit_id") REFERENCES "public"."org_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_unit_positions" ADD CONSTRAINT "org_unit_positions_position_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_unit_leaders" ADD CONSTRAINT "org_unit_leaders_org_unit_fk" FOREIGN KEY ("org_unit_id") REFERENCES "public"."org_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_unit_leaders" ADD CONSTRAINT "org_unit_leaders_employee_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_policy_rules" ADD CONSTRAINT "leave_policy_rules_policy_id_leave_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."leave_policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_policy_rules" ADD CONSTRAINT "leave_policy_rules_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_request_approvals" ADD CONSTRAINT "leave_request_approvals_leave_request_id_leave_requests_id_fk" FOREIGN KEY ("leave_request_id") REFERENCES "public"."leave_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_request_approvals" ADD CONSTRAINT "leave_request_approvals_approver_user_id_users_id_fk" FOREIGN KEY ("approver_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_ledger" ADD CONSTRAINT "leave_ledger_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_ledger" ADD CONSTRAINT "leave_ledger_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_ledger" ADD CONSTRAINT "leave_ledger_reference_leave_request_id_leave_requests_id_fk" FOREIGN KEY ("reference_leave_request_id") REFERENCES "public"."leave_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_shift_assignments" ADD CONSTRAINT "employee_shift_assignments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_shift_assignments" ADD CONSTRAINT "employee_shift_assignments_shift_template_id_shift_templates_id_fk" FOREIGN KEY ("shift_template_id") REFERENCES "public"."shift_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_employee_shift_assignments" ADD CONSTRAINT "pending_employee_shift_assignments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_employee_shift_assignments" ADD CONSTRAINT "pending_employee_shift_assignments_shift_template_id_shift_templates_id_fk" FOREIGN KEY ("shift_template_id") REFERENCES "public"."shift_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_employee_shift_assignments" ADD CONSTRAINT "pending_employee_shift_assignments_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_adjustments" ADD CONSTRAINT "attendance_adjustments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_adjustments" ADD CONSTRAINT "attendance_adjustments_attendance_log_id_attendance_logs_id_fk" FOREIGN KEY ("attendance_log_id") REFERENCES "public"."attendance_logs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_adjustments" ADD CONSTRAINT "attendance_adjustments_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_adjustments" ADD CONSTRAINT "attendance_adjustments_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_unit_budgets" ADD CONSTRAINT "org_unit_budgets_org_unit_id_org_units_id_fk" FOREIGN KEY ("org_unit_id") REFERENCES "public"."org_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_unit_budgets" ADD CONSTRAINT "org_unit_budgets_budget_period_id_budget_periods_id_fk" FOREIGN KEY ("budget_period_id") REFERENCES "public"."budget_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_unit_budgets" ADD CONSTRAINT "org_unit_budgets_expense_category_id_expense_categories_id_fk" FOREIGN KEY ("expense_category_id") REFERENCES "public"."expense_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_org_unit_id_org_units_id_fk" FOREIGN KEY ("org_unit_id") REFERENCES "public"."org_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_expense_category_id_expense_categories_id_fk" FOREIGN KEY ("expense_category_id") REFERENCES "public"."expense_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_budget_period_id_budget_periods_id_fk" FOREIGN KEY ("budget_period_id") REFERENCES "public"."budget_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_claim_approvals" ADD CONSTRAINT "expense_claim_approvals_expense_claim_id_expense_claims_id_fk" FOREIGN KEY ("expense_claim_id") REFERENCES "public"."expense_claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_claim_approvals" ADD CONSTRAINT "expense_claim_approvals_approver_user_id_users_id_fk" FOREIGN KEY ("approver_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_ledger" ADD CONSTRAINT "budget_ledger_org_unit_id_org_units_id_fk" FOREIGN KEY ("org_unit_id") REFERENCES "public"."org_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_ledger" ADD CONSTRAINT "budget_ledger_budget_period_id_budget_periods_id_fk" FOREIGN KEY ("budget_period_id") REFERENCES "public"."budget_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_ledger" ADD CONSTRAINT "budget_ledger_expense_category_id_expense_categories_id_fk" FOREIGN KEY ("expense_category_id") REFERENCES "public"."expense_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_ledger" ADD CONSTRAINT "budget_ledger_reference_expense_claim_id_expense_claims_id_fk" FOREIGN KEY ("reference_expense_claim_id") REFERENCES "public"."expense_claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_ledger" ADD CONSTRAINT "budget_ledger_reference_budget_id_org_unit_budgets_id_fk" FOREIGN KEY ("reference_budget_id") REFERENCES "public"."org_unit_budgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_receipts" ADD CONSTRAINT "expense_receipts_expense_claim_id_expense_claims_id_fk" FOREIGN KEY ("expense_claim_id") REFERENCES "public"."expense_claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_receipts" ADD CONSTRAINT "expense_receipts_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manpower_requests" ADD CONSTRAINT "manpower_requests_org_unit_id_org_units_id_fk" FOREIGN KEY ("org_unit_id") REFERENCES "public"."org_units"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manpower_requests" ADD CONSTRAINT "manpower_requests_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manpower_requests" ADD CONSTRAINT "manpower_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manpower_request_approvals" ADD CONSTRAINT "manpower_request_approvals_manpower_request_id_manpower_requests_id_fk" FOREIGN KEY ("manpower_request_id") REFERENCES "public"."manpower_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manpower_request_approvals" ADD CONSTRAINT "manpower_request_approvals_approver_user_id_users_id_fk" FOREIGN KEY ("approver_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_manpower_request_id_manpower_requests_id_fk" FOREIGN KEY ("manpower_request_id") REFERENCES "public"."manpower_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_category_id_skill_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."skill_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_skill_endorsements" ADD CONSTRAINT "employee_skill_endorsements_employee_skill_id_employee_skills_id_fk" FOREIGN KEY ("employee_skill_id") REFERENCES "public"."employee_skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_skill_endorsements" ADD CONSTRAINT "employee_skill_endorsements_endorser_id_employees_id_fk" FOREIGN KEY ("endorser_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_skills" ADD CONSTRAINT "employee_skills_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_skills" ADD CONSTRAINT "employee_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_skills" ADD CONSTRAINT "employee_skills_training_enrollment_id_training_enrollments_id_fk" FOREIGN KEY ("training_enrollment_id") REFERENCES "public"."training_enrollments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_skills" ADD CONSTRAINT "employee_skills_verified_by_id_employees_id_fk" FOREIGN KEY ("verified_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_unit_mandatory_trainings" ADD CONSTRAINT "org_unit_mandatory_trainings_org_unit_id_org_units_id_fk" FOREIGN KEY ("org_unit_id") REFERENCES "public"."org_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_unit_mandatory_trainings" ADD CONSTRAINT "org_unit_mandatory_trainings_program_id_training_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."training_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_mandatory_trainings" ADD CONSTRAINT "position_mandatory_trainings_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_mandatory_trainings" ADD CONSTRAINT "position_mandatory_trainings_program_id_training_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."training_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_prerequisites" ADD CONSTRAINT "training_prerequisites_program_id_training_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."training_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_prerequisites" ADD CONSTRAINT "training_prerequisites_prerequisite_program_id_training_programs_id_fk" FOREIGN KEY ("prerequisite_program_id") REFERENCES "public"."training_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_program_skills" ADD CONSTRAINT "training_program_skills_program_id_training_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."training_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_program_skills" ADD CONSTRAINT "training_program_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_schedule_sessions" ADD CONSTRAINT "training_schedule_sessions_schedule_id_training_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."training_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_schedules" ADD CONSTRAINT "training_schedules_program_id_training_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."training_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_schedules" ADD CONSTRAINT "training_schedules_trainer_id_employees_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_schedule_id_training_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."training_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_processed_by_id_employees_id_fk" FOREIGN KEY ("processed_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_skills" ADD CONSTRAINT "position_skills_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_skills" ADD CONSTRAINT "position_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "employees_employee_no_uq" ON "employees" USING btree ("employee_no");--> statement-breakpoint
CREATE INDEX "employees_hire_date_idx" ON "employees" USING btree ("hire_date");--> statement-breakpoint
CREATE INDEX "employees_last_name_idx" ON "employees" USING btree ("last_name");--> statement-breakpoint
CREATE INDEX "employees_status_idx" ON "employees" USING btree ("employee_status");--> statement-breakpoint
CREATE INDEX "employees_deleted_at_idx" ON "employees" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "employees_org_unit_idx" ON "employees" USING btree ("org_unit_id");--> statement-breakpoint
CREATE INDEX "employees_position_idx" ON "employees" USING btree ("position_id");--> statement-breakpoint
CREATE INDEX "employees_org_unit_position_idx" ON "employees" USING btree ("org_unit_id","position_id");--> statement-breakpoint
CREATE INDEX "employees_supervisor_idx" ON "employees" USING btree ("supervisor_id");--> statement-breakpoint
CREATE INDEX "employee_identifiers_employee_id_idx" ON "employee_identifiers" USING btree ("employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_identifiers_tin_uq" ON "employee_identifiers" USING btree ("tin_no");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_identifiers_sss_no_uq" ON "employee_identifiers" USING btree ("sss_no");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_identifiers_philhealth_no_uq" ON "employee_identifiers" USING btree ("philhealth_no");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_identifiers_pagibig_no_uq" ON "employee_identifiers" USING btree ("pagibig_no");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_identifiers_umid_no_uq" ON "employee_identifiers" USING btree ("umid_no");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_identifiers_passport_no_uq" ON "employee_identifiers" USING btree ("passport_no");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_identifiers_drivers_license_no_uq" ON "employee_identifiers" USING btree ("drivers_license_no");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_identifiers_prc_license_no_uq" ON "employee_identifiers" USING btree ("prc_license_no");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_identifiers_company_id_no_uq" ON "employee_identifiers" USING btree ("company_id_no");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_profiles_personal_email_uq" ON "employee_profiles" USING btree ("personal_email");--> statement-breakpoint
CREATE INDEX "employee_profiles_birth_date_idx" ON "employee_profiles" USING btree ("birth_date");--> statement-breakpoint
CREATE INDEX "employee_profiles_gender_idx" ON "employee_profiles" USING btree ("gender");--> statement-breakpoint
CREATE INDEX "employee_leave_policies_employee_idx" ON "employee_leave_policies" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_leave_policies_policy_idx" ON "employee_leave_policies" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "employee_leave_policies_deleted_at_idx" ON "employee_leave_policies" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_leave_policies_employee_effective_from_uq" ON "employee_leave_policies" USING btree ("employee_id","effective_from");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_uq" ON "users" USING btree (lower(email));--> statement-breakpoint
CREATE UNIQUE INDEX "users_employee_id_uq" ON "users" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "users_is_active_idx" ON "users" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "users_deleted_at_idx" ON "users" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "users_attendance_pin_locked_until_idx" ON "users" USING btree ("attendance_pin_locked_until");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_code_uq" ON "roles" USING btree ("code");--> statement-breakpoint
CREATE INDEX "user_roles_user_idx" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_roles_role_idx" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "user_refresh_tokens_user_idx" ON "user_refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_refresh_tokens_jti_uq" ON "user_refresh_tokens" USING btree ("jti");--> statement-breakpoint
CREATE INDEX "user_refresh_tokens_token_hash_idx" ON "user_refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "user_identities_provider_id_uq" ON "user_identities" USING btree ("provider","provider_id");--> statement-breakpoint
CREATE INDEX "ot_requests_employee_idx" ON "overtime_requests" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "ot_requests_status_idx" ON "overtime_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ot_requests_date_idx" ON "overtime_requests" USING btree ("date");--> statement-breakpoint
CREATE INDEX "positions_title_idx" ON "positions" USING btree ("title");--> statement-breakpoint
CREATE INDEX "org_units_parent_idx" ON "org_units" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "org_unit_leaders_org_unit_idx" ON "org_unit_leaders" USING btree ("org_unit_id");--> statement-breakpoint
CREATE INDEX "org_unit_leaders_employee_idx" ON "org_unit_leaders" USING btree ("employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "holidays_date_country_uq" ON "holidays" USING btree ("date","country_code");--> statement-breakpoint
CREATE INDEX "holidays_country_idx" ON "holidays" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "holidays_deleted_at_idx" ON "holidays" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "leave_types_code_uq" ON "leave_types" USING btree ("code");--> statement-breakpoint
CREATE INDEX "leave_types_name_idx" ON "leave_types" USING btree ("name");--> statement-breakpoint
CREATE INDEX "leave_types_deleted_at_idx" ON "leave_types" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "leave_policies_code_uq" ON "leave_policies" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "leave_policies_default_uq" ON "leave_policies" USING btree ("is_default") WHERE "leave_policies"."is_default" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "leave_policy_rules_policy_leave_type_uq" ON "leave_policy_rules" USING btree ("policy_id","leave_type_id");--> statement-breakpoint
CREATE INDEX "leave_requests_employee_idx" ON "leave_requests" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "leave_requests_leave_type_idx" ON "leave_requests" USING btree ("leave_type_id");--> statement-breakpoint
CREATE INDEX "leave_requests_status_idx" ON "leave_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leave_request_approvals_request_idx" ON "leave_request_approvals" USING btree ("leave_request_id");--> statement-breakpoint
CREATE INDEX "leave_request_approvals_approver_idx" ON "leave_request_approvals" USING btree ("approver_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "leave_request_approvals_request_level_uq" ON "leave_request_approvals" USING btree ("leave_request_id","level");--> statement-breakpoint
CREATE INDEX "leave_ledger_employee_idx" ON "leave_ledger" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "leave_ledger_leave_type_idx" ON "leave_ledger" USING btree ("leave_type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "leave_ledger_accrual_key_uq" ON "leave_ledger" USING btree ("employee_id","leave_type_id","accrual_key");--> statement-breakpoint
CREATE UNIQUE INDEX "shift_templates_code_uq" ON "shift_templates" USING btree ("code") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "shift_templates_is_active_idx" ON "shift_templates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "shift_templates_deleted_at_idx" ON "shift_templates" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_shift_assignments_employee_uq" ON "employee_shift_assignments" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_shift_assignments_shift_template_idx" ON "employee_shift_assignments" USING btree ("shift_template_id");--> statement-breakpoint
CREATE INDEX "pending_shift_assignments_employee_idx" ON "pending_employee_shift_assignments" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "pending_shift_assignments_effective_date_idx" ON "pending_employee_shift_assignments" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "pending_shift_assignments_status_idx" ON "pending_employee_shift_assignments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pending_shift_assignments_employee_status_idx" ON "pending_employee_shift_assignments" USING btree ("employee_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "pending_shift_assignments_pending_per_employee_uq" ON "pending_employee_shift_assignments" USING btree ("employee_id") WHERE status = 'PENDING';--> statement-breakpoint
CREATE INDEX "attendance_logs_employee_idx" ON "attendance_logs" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "attendance_logs_work_date_idx" ON "attendance_logs" USING btree ("work_date");--> statement-breakpoint
CREATE INDEX "attendance_logs_is_locked_idx" ON "attendance_logs" USING btree ("is_locked");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_logs_employee_work_date_uq" ON "attendance_logs" USING btree ("employee_id","work_date");--> statement-breakpoint
CREATE INDEX "attendance_adjustments_employee_idx" ON "attendance_adjustments" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "attendance_adjustments_status_idx" ON "attendance_adjustments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "attendance_adjustments_log_idx" ON "attendance_adjustments" USING btree ("attendance_log_id");--> statement-breakpoint
CREATE INDEX "attendance_adjustments_work_date_idx" ON "attendance_adjustments" USING btree ("work_date");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_adjustments_pending_date_uq" ON "attendance_adjustments" USING btree ("employee_id","work_date") WHERE status = 'PENDING';--> statement-breakpoint
CREATE UNIQUE INDEX "expense_categories_code_uq" ON "expense_categories" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "budget_periods_code_uq" ON "budget_periods" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "org_unit_budgets_uq" ON "org_unit_budgets" USING btree ("org_unit_id","budget_period_id","expense_category_id");--> statement-breakpoint
CREATE INDEX "expense_claims_employee_idx" ON "expense_claims" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "expense_claims_org_unit_idx" ON "expense_claims" USING btree ("org_unit_id");--> statement-breakpoint
CREATE INDEX "expense_claims_status_idx" ON "expense_claims" USING btree ("status");--> statement-breakpoint
CREATE INDEX "expense_claim_approvals_claim_idx" ON "expense_claim_approvals" USING btree ("expense_claim_id");--> statement-breakpoint
CREATE INDEX "expense_claim_approvals_approver_idx" ON "expense_claim_approvals" USING btree ("approver_user_id");--> statement-breakpoint
CREATE INDEX "budget_ledger_org_unit_idx" ON "budget_ledger" USING btree ("org_unit_id");--> statement-breakpoint
CREATE INDEX "budget_ledger_period_idx" ON "budget_ledger" USING btree ("budget_period_id");--> statement-breakpoint
CREATE INDEX "budget_ledger_category_idx" ON "budget_ledger" USING btree ("expense_category_id");--> statement-breakpoint
CREATE INDEX "manpower_requests_org_unit_idx" ON "manpower_requests" USING btree ("org_unit_id");--> statement-breakpoint
CREATE INDEX "manpower_requests_status_idx" ON "manpower_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "manpower_requests_requested_by_idx" ON "manpower_requests" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "manpower_request_approvals_request_idx" ON "manpower_request_approvals" USING btree ("manpower_request_id");--> statement-breakpoint
CREATE INDEX "manpower_request_approvals_approver_idx" ON "manpower_request_approvals" USING btree ("approver_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "manpower_request_approvals_request_level_uq" ON "manpower_request_approvals" USING btree ("manpower_request_id","level");--> statement-breakpoint
CREATE INDEX "job_postings_request_idx" ON "job_postings" USING btree ("manpower_request_id");--> statement-breakpoint
CREATE INDEX "job_postings_slug_idx" ON "job_postings" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "job_postings_status_idx" ON "job_postings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "skills_name_idx" ON "skills" USING btree ("name");--> statement-breakpoint
CREATE INDEX "skills_category_idx" ON "skills" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "employee_skills_employee_idx" ON "employee_skills" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_skills_skill_idx" ON "employee_skills" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "employee_skills_status_idx" ON "employee_skills" USING btree ("skill_verification_status");--> statement-breakpoint
CREATE UNIQUE INDEX "org_unit_mandatory_trainings_uq" ON "org_unit_mandatory_trainings" USING btree ("org_unit_id","program_id");--> statement-breakpoint
CREATE UNIQUE INDEX "position_mandatory_trainings_uq" ON "position_mandatory_trainings" USING btree ("position_id","program_id");--> statement-breakpoint
CREATE UNIQUE INDEX "training_prerequisites_uq" ON "training_prerequisites" USING btree ("program_id","prerequisite_program_id");--> statement-breakpoint
CREATE UNIQUE INDEX "training_enrollments_schedule_employee_uq" ON "training_enrollments" USING btree ("schedule_id","employee_id");--> statement-breakpoint
CREATE INDEX "position_skills_position_idx" ON "position_skills" USING btree ("position_id");--> statement-breakpoint
CREATE INDEX "position_skills_skill_idx" ON "position_skills" USING btree ("skill_id");
CREATE TYPE "public"."employee_status" AS ENUM('ACTIVE', 'PROBATION', 'RESIGNED', 'TERMINATED', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('REGULAR', 'PROBATIONARY', 'CONTRACTUAL', 'CONSULTANT', 'INTERN');--> statement-breakpoint
CREATE TYPE "public"."civil_status" AS ENUM('SINGLE', 'MARRIED', 'SEPARATED', 'WIDOWED', 'ANNULLED', 'LIVE_IN');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY');--> statement-breakpoint
CREATE TYPE "public"."org_unit_leader_role" AS ENUM('HEAD', 'CO_HEAD', 'ACTING_HEAD');--> statement-breakpoint
CREATE TYPE "public"."accrual_method" AS ENUM('MONTHLY', 'ANNUAL_GRANT', 'NONE');--> statement-breakpoint
CREATE TYPE "public"."leave_request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."leave_approval_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."leave_ledger_entry_type" AS ENUM('ACCRUAL', 'CONSUMPTION', 'ADJUSTMENT');--> statement-breakpoint
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
	"country_code" varchar(10) DEFAULT 'PH' NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
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
	"days" numeric(10, 4) NOT NULL,
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
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE UNIQUE INDEX "roles_code_uq" ON "roles" USING btree ("code");--> statement-breakpoint
CREATE INDEX "user_roles_user_idx" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_roles_role_idx" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "user_refresh_tokens_user_idx" ON "user_refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_refresh_tokens_jti_uq" ON "user_refresh_tokens" USING btree ("jti");--> statement-breakpoint
CREATE INDEX "user_refresh_tokens_token_hash_idx" ON "user_refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
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
CREATE UNIQUE INDEX "leave_policy_rules_policy_leave_type_uq" ON "leave_policy_rules" USING btree ("policy_id","leave_type_id");--> statement-breakpoint
CREATE INDEX "leave_requests_employee_idx" ON "leave_requests" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "leave_requests_leave_type_idx" ON "leave_requests" USING btree ("leave_type_id");--> statement-breakpoint
CREATE INDEX "leave_requests_status_idx" ON "leave_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leave_request_approvals_request_idx" ON "leave_request_approvals" USING btree ("leave_request_id");--> statement-breakpoint
CREATE INDEX "leave_request_approvals_approver_idx" ON "leave_request_approvals" USING btree ("approver_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "leave_request_approvals_request_level_uq" ON "leave_request_approvals" USING btree ("leave_request_id","level");--> statement-breakpoint
CREATE INDEX "leave_ledger_employee_idx" ON "leave_ledger" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "leave_ledger_leave_type_idx" ON "leave_ledger" USING btree ("leave_type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "leave_ledger_accrual_key_uq" ON "leave_ledger" USING btree ("employee_id","leave_type_id","accrual_key");
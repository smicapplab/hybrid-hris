CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_no" varchar(50) NOT NULL,
	"first_name" varchar(120) NOT NULL,
	"last_name" varchar(120) NOT NULL,
	"middle_name" varchar(120),
	"email" varchar(320) NOT NULL,
	"alternate_email" varchar(320),
	"hire_date" date NOT NULL,
	"address_line1" varchar(250),
	"address_line2" varchar(250),
	"city" varchar(120),
	"province" varchar(120),
	"postal_code" varchar(20),
	"country_code" varchar(10) DEFAULT 'PH' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "employees_employee_no_uq" ON "employees" USING btree ("employee_no");--> statement-breakpoint
CREATE UNIQUE INDEX "employees_email_uq" ON "employees" USING btree ("email");--> statement-breakpoint
CREATE INDEX "employees_hire_date_idx" ON "employees" USING btree ("hire_date");
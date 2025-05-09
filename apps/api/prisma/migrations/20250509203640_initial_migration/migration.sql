-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "cmdb";

-- CreateTable
CREATE TABLE "cmdb"."Department" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "parent_id" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmdb"."Location" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "address" TEXT,
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "country" VARCHAR(100),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmdb"."Role" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmdb"."user_statuses" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmdb"."User" (
    "id" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "employee_id" VARCHAR(50),
    "phone" VARCHAR(50),
    "role_id" INTEGER NOT NULL,
    "status_id" INTEGER NOT NULL,
    "department_id" INTEGER,
    "manager_id" UUID,
    "location_id" INTEGER,
    "position_title" VARCHAR(100),
    "building" VARCHAR(100),
    "room_number" VARCHAR(20),
    "hire_date" DATE,
    "last_login" TIMESTAMPTZ,
    "profile_picture" BYTEA,
    "profile_picture_type" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmdb"."asset_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "parent_id" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmdb"."asset_types" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "category_id" INTEGER NOT NULL,
    "has_serial_number" BOOLEAN NOT NULL DEFAULT true,
    "has_mac_address" BOOLEAN NOT NULL DEFAULT false,
    "has_imei" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmdb"."vendors" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "contact_person" VARCHAR(100),
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "website" VARCHAR(255),
    "address" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmdb"."assets" (
    "id" UUID NOT NULL,
    "asset_tag" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "asset_type_id" INTEGER NOT NULL,
    "serial_number" VARCHAR(100),
    "mac_address" VARCHAR(50),
    "imei" VARCHAR(50),
    "status" VARCHAR(50) NOT NULL DEFAULT 'available',
    "acquisition_date" DATE,
    "acquisition_cost" DECIMAL(12,2),
    "vendor_id" INTEGER,
    "warranty_start_date" DATE,
    "warranty_end_date" DATE,
    "expected_lifetime_months" INTEGER,
    "make" VARCHAR(100),
    "model" VARCHAR(100),
    "specifications" TEXT,
    "notes" TEXT,
    "department_id" INTEGER,
    "location_id" INTEGER,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmdb"."asset_maintenance" (
    "id" SERIAL NOT NULL,
    "asset_id" UUID NOT NULL,
    "maintenance_date" DATE NOT NULL,
    "maintenance_type" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "performed_by" VARCHAR(255),
    "cost" DECIMAL(12,2),
    "status" VARCHAR(50),
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmdb"."asset_assignments" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "assigned_to" UUID NOT NULL,
    "assigned_by" UUID,
    "assignment_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_return_date" TIMESTAMPTZ,
    "actual_return_date" TIMESTAMPTZ,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "purpose" TEXT,
    "notes" TEXT,
    "condition_on_assignment" TEXT,
    "condition_on_return" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmdb"."assignment_history" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "assigned_to" UUID NOT NULL,
    "assigned_by" UUID,
    "assignment_date" TIMESTAMPTZ NOT NULL,
    "return_date" TIMESTAMPTZ NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "purpose" TEXT,
    "notes" TEXT,
    "condition_on_assignment" TEXT,
    "condition_on_return" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmdb"."protocols" (
    "id" UUID NOT NULL,
    "reference_number" VARCHAR(100) NOT NULL,
    "protocol_type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "assignment_id" UUID,
    "user_id" UUID,
    "admin_id" UUID,
    "asset_id" UUID,
    "generated_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "document_path" VARCHAR(512),
    "signed_date" TIMESTAMPTZ,
    "signature_user" BYTEA,
    "signature_admin" BYTEA,
    "terms_and_conditions" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "protocols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmdb"."notifications" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "notification_type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "related_asset_id" UUID,
    "related_assignment_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmdb"."custom_field_definitions" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "field_type" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "options" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_field_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmdb"."asset_custom_fields" (
    "id" SERIAL NOT NULL,
    "asset_id" UUID NOT NULL,
    "field_id" INTEGER NOT NULL,
    "value" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmdb"."user_custom_fields" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "field_id" INTEGER NOT NULL,
    "value" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmdb"."reports" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "report_type" VARCHAR(100) NOT NULL,
    "parameters" JSONB,
    "created_by" UUID,
    "last_generated" TIMESTAMPTZ,
    "schedule_type" VARCHAR(50),
    "schedule_details" JSONB,
    "recipients" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmdb"."report_results" (
    "id" SERIAL NOT NULL,
    "report_id" INTEGER NOT NULL,
    "generated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generated_by" UUID,
    "file_path" VARCHAR(512),
    "file_type" VARCHAR(50),
    "file_size" INTEGER,
    "is_scheduled" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(50),
    "parameters_used" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmdb"."audit_log" (
    "id" SERIAL NOT NULL,
    "user_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" VARCHAR(100) NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" VARCHAR(50),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmdb"."system_settings" (
    "id" SERIAL NOT NULL,
    "setting_key" VARCHAR(100) NOT NULL,
    "setting_value" TEXT,
    "setting_group" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_editable" BOOLEAN NOT NULL DEFAULT true,
    "data_type" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmdb"."email_templates" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "subject" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "template_type" VARCHAR(100) NOT NULL,
    "variables" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "cmdb"."Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_statuses_name_key" ON "cmdb"."user_statuses"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "cmdb"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "cmdb"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_employee_id_key" ON "cmdb"."User"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "assets_asset_tag_key" ON "cmdb"."assets"("asset_tag");

-- CreateIndex
CREATE UNIQUE INDEX "assets_serial_number_key" ON "cmdb"."assets"("serial_number");

-- CreateIndex
CREATE UNIQUE INDEX "protocols_reference_number_key" ON "cmdb"."protocols"("reference_number");

-- CreateIndex
CREATE UNIQUE INDEX "asset_custom_fields_asset_id_field_id_key" ON "cmdb"."asset_custom_fields"("asset_id", "field_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_custom_fields_user_id_field_id_key" ON "cmdb"."user_custom_fields"("user_id", "field_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_setting_key_key" ON "cmdb"."system_settings"("setting_key");

-- AddForeignKey
ALTER TABLE "cmdb"."Department" ADD CONSTRAINT "Department_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "cmdb"."Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."User" ADD CONSTRAINT "User_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "cmdb"."Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."User" ADD CONSTRAINT "User_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "cmdb"."user_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."User" ADD CONSTRAINT "User_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "cmdb"."Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."User" ADD CONSTRAINT "User_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "cmdb"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."User" ADD CONSTRAINT "User_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "cmdb"."Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."asset_categories" ADD CONSTRAINT "asset_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "cmdb"."asset_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."asset_types" ADD CONSTRAINT "asset_types_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "cmdb"."asset_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."assets" ADD CONSTRAINT "assets_asset_type_id_fkey" FOREIGN KEY ("asset_type_id") REFERENCES "cmdb"."asset_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."assets" ADD CONSTRAINT "assets_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "cmdb"."vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."assets" ADD CONSTRAINT "assets_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "cmdb"."Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."assets" ADD CONSTRAINT "assets_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "cmdb"."Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."assets" ADD CONSTRAINT "assets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "cmdb"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."asset_maintenance" ADD CONSTRAINT "asset_maintenance_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "cmdb"."assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."asset_maintenance" ADD CONSTRAINT "asset_maintenance_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "cmdb"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."asset_assignments" ADD CONSTRAINT "asset_assignments_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "cmdb"."assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."asset_assignments" ADD CONSTRAINT "asset_assignments_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "cmdb"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."asset_assignments" ADD CONSTRAINT "asset_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "cmdb"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."assignment_history" ADD CONSTRAINT "assignment_history_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "cmdb"."assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."assignment_history" ADD CONSTRAINT "assignment_history_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "cmdb"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."assignment_history" ADD CONSTRAINT "assignment_history_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "cmdb"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."protocols" ADD CONSTRAINT "protocols_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "cmdb"."asset_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."protocols" ADD CONSTRAINT "protocols_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "cmdb"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."protocols" ADD CONSTRAINT "protocols_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "cmdb"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."protocols" ADD CONSTRAINT "protocols_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "cmdb"."assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "cmdb"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."notifications" ADD CONSTRAINT "notifications_related_asset_id_fkey" FOREIGN KEY ("related_asset_id") REFERENCES "cmdb"."assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."notifications" ADD CONSTRAINT "notifications_related_assignment_id_fkey" FOREIGN KEY ("related_assignment_id") REFERENCES "cmdb"."asset_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."asset_custom_fields" ADD CONSTRAINT "asset_custom_fields_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "cmdb"."assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."asset_custom_fields" ADD CONSTRAINT "asset_custom_fields_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "cmdb"."custom_field_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."user_custom_fields" ADD CONSTRAINT "user_custom_fields_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "cmdb"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."user_custom_fields" ADD CONSTRAINT "user_custom_fields_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "cmdb"."custom_field_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."reports" ADD CONSTRAINT "reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "cmdb"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."report_results" ADD CONSTRAINT "report_results_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "cmdb"."reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."report_results" ADD CONSTRAINT "report_results_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "cmdb"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmdb"."audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "cmdb"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

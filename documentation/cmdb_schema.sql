-- InvenTrack CMDB PostgreSQL Database Schema
-- This schema implements all the features specified in the documentation

-- Enable UUID extension for unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schema
CREATE SCHEMA IF NOT EXISTS cmdb;

-- Set search path
SET search_path TO cmdb, public;

-- ENUM TYPES

-- User status
CREATE TYPE user_status AS ENUM (
    'active', 
    'inactive', 
    'on_leave', 
    'terminated'
);

-- User roles
CREATE TYPE user_role AS ENUM (
    'standard_user', 
    'manager', 
    'hr', 
    'admin'
);

-- Asset status
CREATE TYPE asset_status AS ENUM (
    'available', 
    'assigned', 
    'under_repair', 
    'retired', 
    'lost'
);

-- Assignment status
CREATE TYPE assignment_status AS ENUM (
    'active', 
    'scheduled_return', 
    'overdue', 
    'returned', 
    'transferred'
);

-- Protocol type
CREATE TYPE protocol_type AS ENUM (
    'assignment', 
    'return', 
    'temporary_loan', 
    'transfer', 
    'disposal'
);

-- Notification type
CREATE TYPE notification_type AS ENUM (
    'account_creation', 
    'account_modification', 
    'asset_assignment', 
    'asset_return_reminder', 
    'asset_return_confirmation', 
    'warranty_expiration', 
    'scheduled_maintenance', 
    'report_generation'
);

-- TABLES

-- Departments
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Locations
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    employee_id VARCHAR(50) UNIQUE,
    phone VARCHAR(50),
    role user_role NOT NULL DEFAULT 'standard_user',
    status user_status NOT NULL DEFAULT 'active',
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    position_title VARCHAR(100),
    building VARCHAR(100),
    room_number VARCHAR(20),
    hire_date DATE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Asset Categories
CREATE TABLE asset_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES asset_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Asset Types
CREATE TABLE asset_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id INTEGER NOT NULL REFERENCES asset_categories(id) ON DELETE CASCADE,
    has_serial_number BOOLEAN DEFAULT true,
    has_mac_address BOOLEAN DEFAULT false,
    has_imei BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vendors
CREATE TABLE vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assets
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_tag VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    asset_type_id INTEGER NOT NULL REFERENCES asset_types(id) ON DELETE RESTRICT,
    serial_number VARCHAR(100) UNIQUE,
    mac_address VARCHAR(50),
    imei VARCHAR(50),
    status asset_status NOT NULL DEFAULT 'available',
    acquisition_date DATE,
    acquisition_cost DECIMAL(12, 2),
    vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
    warranty_start_date DATE,
    warranty_end_date DATE,
    expected_lifetime_months INTEGER,
    make VARCHAR(100),
    model VARCHAR(100),
    specifications TEXT,
    notes TEXT,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Asset Maintenance
CREATE TABLE asset_maintenance (
    id SERIAL PRIMARY KEY,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    maintenance_date DATE NOT NULL,
    maintenance_type VARCHAR(100) NOT NULL,
    description TEXT,
    performed_by VARCHAR(255),
    cost DECIMAL(12, 2),
    status VARCHAR(50),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Asset Assignments
CREATE TABLE asset_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    assigned_to UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assignment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expected_return_date TIMESTAMP WITH TIME ZONE,
    actual_return_date TIMESTAMP WITH TIME ZONE,
    status assignment_status NOT NULL DEFAULT 'active',
    purpose TEXT,
    notes TEXT,
    condition_on_assignment TEXT,
    condition_on_return TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assignment History (stores all previous assignments)
CREATE TABLE assignment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    assigned_to UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assignment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    return_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status assignment_status NOT NULL,
    purpose TEXT,
    notes TEXT,
    condition_on_assignment TEXT,
    condition_on_return TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Protocols
CREATE TABLE protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(100) UNIQUE NOT NULL,
    protocol_type protocol_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    assignment_id UUID REFERENCES asset_assignments(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    generated_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    document_path VARCHAR(512),
    signed_date TIMESTAMP WITH TIME ZONE,
    signature_user BYTEA,
    signature_admin BYTEA,
    terms_and_conditions TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    related_assignment_id UUID REFERENCES asset_assignments(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Custom Fields Definition
CREATE TABLE custom_field_definitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    field_type VARCHAR(50) NOT NULL, -- text, number, date, boolean, etc.
    entity_type VARCHAR(50) NOT NULL, -- 'asset', 'user', 'department', etc.
    is_required BOOLEAN DEFAULT false,
    options TEXT, -- JSON array of options for select fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Custom Field Values for Assets
CREATE TABLE asset_custom_fields (
    id SERIAL PRIMARY KEY,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    field_id INTEGER NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (asset_id, field_id)
);

-- Custom Field Values for Users
CREATE TABLE user_custom_fields (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_id INTEGER NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, field_id)
);

-- Reports
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    report_type VARCHAR(100) NOT NULL, -- inventory, user_assignment, department_allocation, etc.
    parameters JSONB, -- Store report parameters
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    last_generated TIMESTAMP WITH TIME ZONE,
    schedule_type VARCHAR(50), -- daily, weekly, monthly, quarterly, none
    schedule_details JSONB, -- Store schedule configuration
    recipients JSONB, -- Store recipient emails/user IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Report Results
CREATE TABLE report_results (
    id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    file_path VARCHAR(512),
    file_type VARCHAR(50), -- PDF, Excel, CSV, etc.
    file_size INTEGER, -- Size in bytes
    is_scheduled BOOLEAN DEFAULT false,
    status VARCHAR(50), -- completed, failed, in_progress
    parameters_used JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- create, update, delete, login, logout, etc.
    entity_type VARCHAR(100) NOT NULL, -- user, asset, assignment, etc.
    entity_id VARCHAR(100) NOT NULL, -- ID of the affected entity
    old_values JSONB, -- Previous values before change
    new_values JSONB, -- New values after change
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System Settings
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_group VARCHAR(100) NOT NULL,
    description TEXT,
    is_editable BOOLEAN DEFAULT true,
    data_type VARCHAR(50) NOT NULL, -- string, number, boolean, json, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email Templates
CREATE TABLE email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    template_type VARCHAR(100) NOT NULL, -- welcome, assignment, reminder, etc.
    variables JSONB, -- Available template variables
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============== INDEXES ==================

-- Users indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_manager_id ON users(manager_id);
CREATE INDEX idx_users_location_id ON users(location_id);
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_name ON users(last_name, first_name);

-- Assets indexes
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_type_id ON assets(asset_type_id);
CREATE INDEX idx_assets_department_id ON assets(department_id);
CREATE INDEX idx_assets_location_id ON assets(location_id);
CREATE INDEX idx_assets_vendor_id ON assets(vendor_id);
CREATE INDEX idx_assets_serial_number ON assets(serial_number);
CREATE INDEX idx_assets_warranty_end_date ON assets(warranty_end_date);

-- Asset assignments indexes
CREATE INDEX idx_asset_assignments_asset_id ON asset_assignments(asset_id);
CREATE INDEX idx_asset_assignments_assigned_to ON asset_assignments(assigned_to);
CREATE INDEX idx_asset_assignments_assigned_by ON asset_assignments(assigned_by);
CREATE INDEX idx_asset_assignments_status ON asset_assignments(status);
CREATE INDEX idx_asset_assignments_expected_return_date ON asset_assignments(expected_return_date);

-- Assignment history indexes
CREATE INDEX idx_assignment_history_asset_id ON assignment_history(asset_id);
CREATE INDEX idx_assignment_history_assigned_to ON assignment_history(assigned_to);

-- Protocols indexes
CREATE INDEX idx_protocols_type ON protocols(protocol_type);
CREATE INDEX idx_protocols_assignment_id ON protocols(assignment_id);
CREATE INDEX idx_protocols_user_id ON protocols(user_id);
CREATE INDEX idx_protocols_asset_id ON protocols(asset_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Audit log indexes
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity_type ON audit_log(entity_type);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- ============== FUNCTIONS AND TRIGGERS ==================

-- Function to update the "updated_at" column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update timestamps triggers
CREATE TRIGGER trigger_update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trigger_update_assets_timestamp
BEFORE UPDATE ON assets
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trigger_update_asset_assignments_timestamp
BEFORE UPDATE ON asset_assignments
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trigger_update_departments_timestamp
BEFORE UPDATE ON departments
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trigger_update_locations_timestamp
BEFORE UPDATE ON locations
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trigger_update_asset_types_timestamp
BEFORE UPDATE ON asset_types
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trigger_update_asset_categories_timestamp
BEFORE UPDATE ON asset_categories
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trigger_update_vendors_timestamp
BEFORE UPDATE ON vendors
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trigger_update_protocols_timestamp
BEFORE UPDATE ON protocols
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trigger_update_custom_field_definitions_timestamp
BEFORE UPDATE ON custom_field_definitions
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trigger_update_asset_custom_fields_timestamp
BEFORE UPDATE ON asset_custom_fields
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trigger_update_user_custom_fields_timestamp
BEFORE UPDATE ON user_custom_fields
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trigger_update_reports_timestamp
BEFORE UPDATE ON reports
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trigger_update_system_settings_timestamp
BEFORE UPDATE ON system_settings
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trigger_update_email_templates_timestamp
BEFORE UPDATE ON email_templates
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to update asset status when assignment changes
CREATE OR REPLACE FUNCTION update_asset_status_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- If a new assignment is created or an existing one becomes active
    IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status = 'active' AND OLD.status != 'active')) THEN
        -- Set asset status to 'assigned'
        UPDATE assets SET status = 'assigned', updated_at = CURRENT_TIMESTAMP WHERE id = NEW.asset_id;
    -- If assignment is returned or no longer active
    ELSIF (TG_OP = 'UPDATE' AND NEW.status IN ('returned', 'transferred') AND OLD.status = 'active') THEN
        -- Set asset status back to 'available'
        UPDATE assets SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = NEW.asset_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update asset status on assignment changes
CREATE TRIGGER trigger_update_asset_status_on_assignment
AFTER INSERT OR UPDATE ON asset_assignments
FOR EACH ROW EXECUTE PROCEDURE update_asset_status_on_assignment();

-- Function to log assignments to history on return or transfer
CREATE OR REPLACE FUNCTION log_assignment_to_history()
RETURNS TRIGGER AS $$
BEGIN
    -- If an assignment is returned or transferred
    IF (NEW.status IN ('returned', 'transferred') AND OLD.status = 'active') THEN
        -- Insert the assignment into history
        INSERT INTO assignment_history (
            asset_id, assigned_to, assigned_by, assignment_date, 
            return_date, status, purpose, notes, 
            condition_on_assignment, condition_on_return
        ) VALUES (
            OLD.asset_id, OLD.assigned_to, OLD.assigned_by, OLD.assignment_date,
            NEW.actual_return_date, NEW.status, OLD.purpose, OLD.notes,
            OLD.condition_on_assignment, NEW.condition_on_return
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log assignments to history
CREATE TRIGGER trigger_log_assignment_to_history
AFTER UPDATE ON asset_assignments
FOR EACH ROW EXECUTE PROCEDURE log_assignment_to_history();

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    old_values JSONB := '{}'::JSONB;
    new_values JSONB := '{}'::JSONB;
    user_id UUID;
    action VARCHAR(100);
BEGIN
    -- Get current user ID (would need to be set in the session context)
    -- This is a placeholder implementation
    user_id := current_setting('app.current_user_id', TRUE);
    
    -- Determine the action type
    IF TG_OP = 'INSERT' THEN
        action := 'create';
        new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        action := 'update';
        old_values := to_jsonb(OLD);
        new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        action := 'delete';
        old_values := to_jsonb(OLD);
    END IF;
    
    -- Insert the audit log entry
    INSERT INTO audit_log (
        user_id, action, entity_type, entity_id, old_values, new_values
    ) VALUES (
        user_id, action, TG_TABLE_NAME, CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id::text
            ELSE NEW.id::text
        END, old_values, new_values
    );
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add audit log triggers for important tables
CREATE TRIGGER trigger_audit_log_users
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE PROCEDURE create_audit_log();

CREATE TRIGGER trigger_audit_log_assets
AFTER INSERT OR UPDATE OR DELETE ON assets
FOR EACH ROW EXECUTE PROCEDURE create_audit_log();

CREATE TRIGGER trigger_audit_log_asset_assignments
AFTER INSERT OR UPDATE OR DELETE ON asset_assignments
FOR EACH ROW EXECUTE PROCEDURE create_audit_log();

-- Add more triggers for other tables as needed

-- ============== VIEWS ==================

-- View for active asset assignments with user and asset details
CREATE OR REPLACE VIEW view_active_assignments AS
SELECT 
    aa.id AS assignment_id,
    aa.assignment_date,
    aa.expected_return_date,
    aa.status AS assignment_status,
    a.id AS asset_id,
    a.asset_tag,
    a.name AS asset_name,
    a.serial_number,
    at.name AS asset_type,
    ac.name AS asset_category,
    u.id AS user_id,
    u.first_name || ' ' || u.last_name AS user_name,
    u.employee_id,
    d.name AS department_name,
    l.name AS location_name
FROM 
    asset_assignments aa
JOIN 
    assets a ON aa.asset_id = a.id
JOIN 
    asset_types at ON a.asset_type_id = at.id
JOIN 
    asset_categories ac ON at.category_id = ac.id
JOIN 
    users u ON aa.assigned_to = u.id
LEFT JOIN 
    departments d ON u.department_id = d.id
LEFT JOIN 
    locations l ON u.location_id = l.id
WHERE 
    aa.status = 'active';

-- View for upcoming warranty expirations
CREATE OR REPLACE VIEW view_warranty_expirations AS
SELECT 
    a.id,
    a.asset_tag,
    a.name,
    a.serial_number,
    a.warranty_end_date,
    a.warranty_end_date - CURRENT_DATE AS days_remaining,
    at.name AS asset_type,
    a.status,
    CASE 
        WHEN aa.id IS NOT NULL THEN u.first_name || ' ' || u.last_name
        ELSE NULL
    END AS assigned_to,
    d.name AS department
FROM 
    assets a
JOIN 
    asset_types at ON a.asset_type_id = at.id
LEFT JOIN 
    asset_assignments aa ON a.id = aa.asset_id AND aa.status = 'active'
LEFT JOIN 
    users u ON aa.assigned_to = u.id
LEFT JOIN 
    departments d ON a.department_id = d.id
WHERE 
    a.warranty_end_date IS NOT NULL 
    AND a.warranty_end_date > CURRENT_DATE
    AND a.warranty_end_date <= CURRENT_DATE + INTERVAL '90 days'
    AND a.status != 'retired';

-- View for asset counts by department
CREATE OR REPLACE VIEW view_asset_counts_by_department AS
SELECT 
    d.id AS department_id,
    d.name AS department_name,
    COUNT(a.id) AS total_assets,
    SUM(CASE WHEN a.status = 'assigned' THEN 1 ELSE 0 END) AS assigned_assets,
    SUM(CASE WHEN a.status = 'available' THEN 1 ELSE 0 END) AS available_assets,
    SUM(CASE WHEN a.status = 'under_repair' THEN 1 ELSE 0 END) AS under_repair_assets,
    SUM(CASE WHEN a.status = 'retired' THEN 1 ELSE 0 END) AS retired_assets,
    SUM(CASE WHEN a.status = 'lost' THEN 1 ELSE 0 END) AS lost_assets
FROM 
    departments d
LEFT JOIN 
    assets a ON d.id = a.department_id
GROUP BY 
    d.id, d.name
ORDER BY 
    d.name;

-- View for user dashboard summary
CREATE OR REPLACE VIEW view_user_dashboard_summary AS
SELECT 
    u.id AS user_id,
    u.first_name || ' ' || u.last_name AS user_name,
    COUNT(aa.id) AS total_active_assignments,
    COUNT(CASE WHEN aa.expected_return_date < CURRENT_TIMESTAMP THEN aa.id ELSE NULL END) AS overdue_assignments,
    COUNT(CASE WHEN aa.expected_return_date BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '7 days' THEN aa.id ELSE NULL END) AS upcoming_returns,
    COUNT(p.id) AS total_protocols,
    COUNT(CASE WHEN n.is_read = false THEN n.id ELSE NULL END) AS unread_notifications
FROM 
    users u
LEFT JOIN 
    asset_assignments aa ON u.id = aa.assigned_to AND aa.status = 'active'
LEFT JOIN 
    protocols p ON u.id = p.user_id
LEFT JOIN 
    notifications n ON u.id = n.user_id
GROUP BY 
    u.id, u.first_name, u.last_name;

-- View for asset utilization
CREATE OR REPLACE VIEW view_asset_utilization AS
WITH assignment_durations AS (
    SELECT 
        asset_id,
        SUM(EXTRACT(EPOCH FROM (
            COALESCE(actual_return_date, CURRENT_TIMESTAMP) - assignment_date
        )) / 86400) AS total_days_assigned
    FROM 
        asset_assignments
    WHERE 
        status IN ('active', 'returned', 'transferred')
        AND assignment_date > CURRENT_TIMESTAMP - INTERVAL '1 year'
    GROUP BY 
        asset_id
)
SELECT 
    a.id AS asset_id,
    a.asset_tag,
    a.name AS asset_name,
    at.name AS asset_type,
    ac.name AS asset_category,
    COALESCE(ad.total_days_assigned, 0) AS days_assigned_past_year,
    CASE 
        WHEN COALESCE(ad.total_days_assigned, 0) > 0 
        THEN ROUND((COALESCE(ad.total_days_assigned, 0) / 365) * 100, 2)
        ELSE 0
    END AS utilization_percentage,
    a.status AS current_status,
    COUNT(DISTINCT aa.id) AS assignment_count_past_year
FROM 
    assets a
LEFT JOIN 
    assignment_durations ad ON a.id = ad.asset_id
LEFT JOIN 
    asset_assignments aa ON a.id = aa.asset_id 
    AND aa.assignment_date > CURRENT_TIMESTAMP - INTERVAL '1 year'
JOIN 
    asset_types at ON a.asset_type_id = at.id
JOIN 
    asset_categories ac ON at.category_id = ac.id
GROUP BY 
    a.id, a.asset_tag, a.name, at.name, ac.name, ad.total_days_assigned, a.status;

-- ============== INITIAL DATA ==================

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_group, description, data_type) VALUES
('site_name', 'InvenTrack', 'branding', 'The name of the site', 'string'),
('company_name', 'Your Company Name', 'branding', 'The company name', 'string'),
('primary_color', '#8A4FFF', 'appearance', 'Primary color for branding', 'string'),
('secondary_color', '#4ECDC4', 'appearance', 'Secondary color for branding', 'string'),
('default_language', 'en', 'localization', 'Default language for the system', 'string'),
('date_format', 'YYYY-MM-DD', 'localization', 'Default date format', 'string'),
('time_format', '24h', 'localization', 'Default time format (12h or 24h)', 'string'),
('smtp_host', '', 'email', 'SMTP Server Host', 'string'),
('smtp_port', '587', 'email', 'SMTP Server Port', 'string'),
('smtp_username', '', 'email', 'SMTP Username', 'string'),
('smtp_password', '', 'email', 'SMTP Password (encrypted)', 'string'),
('smtp_from_email', '', 'email', 'Default From Email Address', 'string'),
('smtp_from_name', '', 'email', 'Default From Name', 'string'),
('password_min_length', '8', 'security', 'Minimum password length', 'number'),
('password_complexity', 'true', 'security', 'Require minimum password length', 'number'),
-- Continued from previous SQL file

-- Insert more default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_group, description, data_type) VALUES
('session_timeout', '30', 'security', 'Session timeout in minutes', 'number'),
('enable_2fa', 'false', 'security', 'Enable two-factor authentication', 'boolean'),
('max_login_attempts', '5', 'security', 'Maximum failed login attempts before lockout', 'number'),
('lockout_duration', '15', 'security', 'Account lockout duration in minutes', 'number'),
('enable_audit_log', 'true', 'security', 'Enable audit logging', 'boolean'),
('default_asset_image', '/assets/images/default-asset.png', 'assets', 'Default image for assets without a photo', 'string'),
('enable_barcode_scanning', 'true', 'assets', 'Enable barcode scanning functionality', 'boolean'),
('notification_expiry_days', '30', 'notifications', 'Days until notifications expire', 'number'),
('default_protocol_footer', 'This document was generated by InvenTrack CMDB.', 'documents', 'Default footer text for protocols', 'string'),
('default_protocol_terms', 'Standard terms and conditions apply. The recipient is responsible for the proper use and care of the assigned assets.', 'documents', 'Default terms for protocols', 'text'),
('enable_email_notifications', 'true', 'notifications', 'Enable email notifications', 'boolean');

-- Insert sample email templates
INSERT INTO email_templates (name, description, subject, body, template_type, variables, is_active) VALUES
('welcome_email', 'Email sent to new users', 'Welcome to {{company_name}} Asset Management System', 
'<p>Dear {{first_name}},</p>
<p>Welcome to the {{company_name}} Asset Management System. Your account has been created with the following details:</p>
<p><strong>Username:</strong> {{username}}<br>
<strong>Temporary Password:</strong> {{password}}</p>
<p>Please log in at <a href="{{login_url}}">{{login_url}}</a> and change your password as soon as possible.</p>
<p>Best regards,<br>
{{company_name}} IT Team</p>', 
'welcome', 
'{"company_name": "Company name", "first_name": "User''s first name", "username": "User''s username", "password": "Temporary password", "login_url": "Login page URL"}', 
true),

('asset_assignment', 'Email sent when assets are assigned', 'Asset Assignment: {{asset_name}}', 
'<p>Dear {{user_name}},</p>
<p>The following asset has been assigned to you:</p>
<p><strong>Asset:</strong> {{asset_name}}<br>
<strong>Asset Tag:</strong> {{asset_tag}}<br>
<strong>Serial Number:</strong> {{serial_number}}<br>
<strong>Assignment Date:</strong> {{assignment_date}}<br>
<strong>Expected Return Date:</strong> {{return_date}}</p>
<p>Please find the attached assignment protocol for your records.</p>
<p>Best regards,<br>
{{company_name}} IT Team</p>', 
'assignment', 
'{"company_name": "Company name", "user_name": "User''s full name", "asset_name": "Asset name", "asset_tag": "Asset tag number", "serial_number": "Asset serial number", "assignment_date": "Date of assignment", "return_date": "Expected return date"}', 
true),

('asset_return_reminder', 'Reminder for upcoming asset returns', 'Reminder: Asset Return Due Soon - {{asset_name}}', 
'<p>Dear {{user_name}},</p>
<p>This is a reminder that the following asset is due to be returned soon:</p>
<p><strong>Asset:</strong> {{asset_name}}<br>
<strong>Asset Tag:</strong> {{asset_tag}}<br>
<strong>Return Date:</strong> {{return_date}}</p>
<p>Please ensure that the asset is returned on or before the due date.</p>
<p>Best regards,<br>
{{company_name}} IT Team</p>', 
'reminder', 
'{"company_name": "Company name", "user_name": "User''s full name", "asset_name": "Asset name", "asset_tag": "Asset tag number", "return_date": "Expected return date"}', 
true),

('warranty_expiration', 'Notification for warranty expiration', 'Warranty Expiration Alert: {{asset_name}}', 
'<p>Dear Admin,</p>
<p>The warranty for the following asset is set to expire soon:</p>
<p><strong>Asset:</strong> {{asset_name}}<br>
<strong>Asset Tag:</strong> {{asset_tag}}<br>
<strong>Serial Number:</strong> {{serial_number}}<br>
<strong>Warranty Expiration Date:</strong> {{expiration_date}}<br>
<strong>Days Remaining:</strong> {{days_remaining}}</p>
<p>Please take appropriate action regarding warranty renewal or asset replacement planning.</p>
<p>Best regards,<br>
InvenTrack System</p>', 
'warranty', 
'{"company_name": "Company name", "asset_name": "Asset name", "asset_tag": "Asset tag number", "serial_number": "Asset serial number", "expiration_date": "Warranty expiration date", "days_remaining": "Days remaining until expiration"}', 
true),

('report_generation', 'Notification for completed report generation', 'Report Generated: {{report_name}}', 
'<p>Dear {{user_name}},</p>
<p>Your requested report has been generated and is now available:</p>
<p><strong>Report:</strong> {{report_name}}<br>
<strong>Generated On:</strong> {{generation_date}}</p>
<p>You can access the report by clicking <a href="{{report_url}}">here</a>.</p>
<p>Best regards,<br>
InvenTrack System</p>', 
'report', 
'{"user_name": "User''s full name", "report_name": "Report name", "generation_date": "Generation date and time", "report_url": "URL to access the report"}', 
true);

-- Insert core asset categories
INSERT INTO asset_categories (name, description) VALUES
('Computing Devices', 'Desktop computers, laptops, and servers'),
('Mobile Devices', 'Smartphones, tablets, and other portable devices'),
('Peripherals', 'External devices that connect to computers'),
('Network Equipment', 'Equipment used for computer networks'),
('Software', 'Software licenses and applications'),
('Office Equipment', 'General office equipment');

-- Insert sample asset types
INSERT INTO asset_types (name, description, category_id, has_serial_number, has_mac_address, has_imei) VALUES
('Laptop', 'Portable computers', 1, true, true, false),
('Desktop Computer', 'Stationary computers', 1, true, true, false),
('Server', 'Computer servers', 1, true, true, false),
('Smartphone', 'Mobile phones with advanced features', 2, true, false, true),
('Tablet', 'Portable touchscreen devices', 2, true, false, true),
('Monitor', 'Display screens', 3, true, false, false),
('Keyboard', 'Input devices', 3, true, false, false),
('Mouse', 'Pointing devices', 3, true, false, false),
('Headset', 'Audio devices', 3, true, false, false),
('Router', 'Network routing devices', 4, true, true, false),
('Switch', 'Network switching devices', 4, true, true, false),
('Access Point', 'Wireless access points', 4, true, true, false),
('Software License', 'Software product licenses', 5, true, false, false),
('Printer', 'Document printing devices', 6, true, true, false),
('Scanner', 'Document scanning devices', 6, true, true, false),
('Projector', 'Image projection devices', 6, true, false, false);

-- Insert sample departments
INSERT INTO departments (name, description) VALUES
('IT', 'Information Technology Department'),
('HR', 'Human Resources Department'),
('Finance', 'Finance and Accounting Department'),
('Sales', 'Sales and Marketing Department'),
('Operations', 'Operations and Logistics Department'),
('Executive', 'Executive Management');

-- Insert sample locations
INSERT INTO locations (name, address, city, state, postal_code, country) VALUES
('Main Office', '123 Main Street', 'New York', 'NY', '10001', 'USA'),
('West Branch', '456 West Avenue', 'San Francisco', 'CA', '94105', 'USA'),
('East Branch', '789 East Boulevard', 'Boston', 'MA', '02110', 'USA'),
('South Branch', '101 South Road', 'Miami', 'FL', '33130', 'USA'),
('North Branch', '202 North Lane', 'Chicago', 'IL', '60601', 'USA'),
('Remote', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A');

-- Insert sample vendors
INSERT INTO vendors (name, contact_person, email, phone, website, address) VALUES
('Dell Technologies', 'John Smith', 'john.smith@dell-example.com', '1-800-123-4567', 'https://www.dell.com', '1 Dell Way, Round Rock, TX 78682'),
('HP Inc.', 'Jane Doe', 'jane.doe@hp-example.com', '1-800-234-5678', 'https://www.hp.com', '1501 Page Mill Road, Palo Alto, CA 94304'),
('Apple Inc.', 'Robert Johnson', 'robert.johnson@apple-example.com', '1-800-345-6789', 'https://www.apple.com', '1 Apple Park Way, Cupertino, CA 95014'),
('Lenovo', 'Sarah Williams', 'sarah.williams@lenovo-example.com', '1-800-456-7890', 'https://www.lenovo.com', '1009 Think Place, Morrisville, NC 27560'),
('Microsoft', 'Michael Brown', 'michael.brown@microsoft-example.com', '1-800-567-8901', 'https://www.microsoft.com', 'One Microsoft Way, Redmond, WA 98052'),
('Cisco Systems', 'Emily Davis', 'emily.davis@cisco-example.com', '1-800-678-9012', 'https://www.cisco.com', '170 West Tasman Drive, San Jose, CA 95134');

-- Insert sample admin user
INSERT INTO users (
    username, password_hash, email, first_name, last_name, employee_id, 
    phone, role, status, department_id, location_id, position_title
) VALUES (
    'admin', 
    '$2a$12$1InE4NxGr/aSNB.LqRvdRul0fJCySRKrb3ZZHiDhWFKiBsZZpfC0e', -- hashed 'admin123'
    'admin@inventrack.example.com', 
    'System', 
    'Administrator', 
    'EMP001', 
    '555-123-4567', 
    'admin', 
    'active', 
    1, 
    1, 
    'System Administrator'
);

-- Add custom field definitions
INSERT INTO custom_field_definitions (name, description, field_type, entity_type, is_required) VALUES
('Purchase Order', 'Purchase order number reference', 'text', 'asset', false),
('Cost Center', 'Cost center responsible for the asset', 'text', 'asset', false),
('Project', 'Associated project', 'text', 'asset', false),
('Depreciation Rate', 'Annual depreciation rate percentage', 'number', 'asset', false),
('Residual Value', 'Expected residual value after full depreciation', 'number', 'asset', false),
('Employee Type', 'Employment type', 'select', 'user', false),
('Start Date', 'Employment start date', 'date', 'user', false),
('Manager Level', 'Management level', 'select', 'user', false);

-- Define some reports
INSERT INTO reports (name, description, report_type, parameters, created_by) VALUES
('Asset Inventory', 'Complete inventory of all assets', 'inventory', '{"include_retired": false, "group_by": "category"}', (SELECT id FROM users WHERE username = 'admin')),
('User Assignments', 'Current asset assignments by user', 'user_assignment', '{"department_id": null, "include_history": false}', (SELECT id FROM users WHERE username = 'admin')),
('Department Allocation', 'Asset allocation by department', 'department_allocation', '{"include_cost": true, "asset_types": []}', (SELECT id FROM users WHERE username = 'admin')),
('Warranty Expiration', 'Assets with warranties expiring in the next 90 days', 'warranty', '{"days_threshold": 90, "include_expired": false}', (SELECT id FROM users WHERE username = 'admin')),
('Asset Utilization', 'Utilization analysis of assets', 'utilization', '{"period_months": 12, "threshold_percentage": 50}', (SELECT id FROM users WHERE username = 'admin'));

-- Create functions for stored procedures

-- Function to assign an asset to a user
CREATE OR REPLACE FUNCTION assign_asset(
    p_asset_id UUID,
    p_user_id UUID,
    p_assigned_by UUID,
    p_expected_return_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_purpose TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_condition TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_assignment_id UUID;
    v_asset_status asset_status;
BEGIN
    -- Check if asset exists and is available
    SELECT status INTO v_asset_status FROM assets WHERE id = p_asset_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Asset not found with ID: %', p_asset_id;
    END IF;
    
    IF v_asset_status != 'available' THEN
        RAISE EXCEPTION 'Asset is not available for assignment. Current status: %', v_asset_status;
    END IF;
    
    -- Create assignment
    INSERT INTO asset_assignments (
        asset_id,
        assigned_to,
        assigned_by,
        assignment_date,
        expected_return_date,
        status,
        purpose,
        notes,
        condition_on_assignment
    ) VALUES (
        p_asset_id,
        p_user_id,
        p_assigned_by,
        CURRENT_TIMESTAMP,
        p_expected_return_date,
        'active',
        p_purpose,
        p_notes,
        p_condition
    ) RETURNING id INTO v_assignment_id;
    
    -- Update asset status (this is also handled by trigger but doing it explicitly)
    UPDATE assets SET status = 'assigned', updated_at = CURRENT_TIMESTAMP WHERE id = p_asset_id;
    
    -- Generate a unique reference number for the protocol
    INSERT INTO protocols (
        reference_number,
        protocol_type,
        title,
        assignment_id,
        user_id,
        admin_id,
        asset_id,
        terms_and_conditions
    ) VALUES (
        'ASG-' || to_char(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || substring(v_assignment_id::text, 1, 8),
        'assignment',
        'Asset Assignment Protocol',
        v_assignment_id,
        p_user_id,
        p_assigned_by,
        p_asset_id,
        (SELECT setting_value FROM system_settings WHERE setting_key = 'default_protocol_terms')
    );
    
    -- Create notification for the user
    INSERT INTO notifications (
        user_id,
        notification_type,
        title,
        message,
        related_asset_id,
        related_assignment_id
    ) VALUES (
        p_user_id,
        'asset_assignment',
        'New Asset Assigned',
        'You have been assigned a new asset: ' || (SELECT name FROM assets WHERE id = p_asset_id),
        p_asset_id,
        v_assignment_id
    );
    
    RETURN v_assignment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to return an asset
CREATE OR REPLACE FUNCTION return_asset(
    p_assignment_id UUID,
    p_condition TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_admin_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_asset_id UUID;
    v_user_id UUID;
    v_assignment_status assignment_status;
BEGIN
    -- Get assignment details
    SELECT asset_id, assigned_to, status INTO v_asset_id, v_user_id, v_assignment_status
    FROM asset_assignments
    WHERE id = p_assignment_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Assignment not found with ID: %', p_assignment_id;
    END IF;
    
    IF v_assignment_status != 'active' THEN
        RAISE EXCEPTION 'Assignment is not active. Current status: %', v_assignment_status;
    END IF;
    
    -- Update assignment
    UPDATE asset_assignments
    SET 
        status = 'returned',
        actual_return_date = CURRENT_TIMESTAMP,
        condition_on_return = p_condition,
        notes = CASE WHEN p_notes IS NOT NULL THEN p_notes ELSE notes END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_assignment_id;
    
    -- Update asset status (this is also handled by trigger but doing it explicitly)
    UPDATE assets SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = v_asset_id;
    
    -- Generate return protocol
    INSERT INTO protocols (
        reference_number,
        protocol_type,
        title,
        assignment_id,
        user_id,
        admin_id,
        asset_id,
        terms_and_conditions
    ) VALUES (
        'RET-' || to_char(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || substring(p_assignment_id::text, 1, 8),
        'return',
        'Asset Return Protocol',
        p_assignment_id,
        v_user_id,
        p_admin_id,
        v_asset_id,
        (SELECT setting_value FROM system_settings WHERE setting_key = 'default_protocol_terms')
    );
    
    -- Create notification
    INSERT INTO notifications (
        user_id,
        notification_type,
        title,
        message,
        related_asset_id,
        related_assignment_id
    ) VALUES (
        v_user_id,
        'asset_return_confirmation',
        'Asset Return Confirmed',
        'Your return of the asset has been processed: ' || (SELECT name FROM assets WHERE id = v_asset_id),
        v_asset_id,
        p_assignment_id
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to transfer an asset from one user to another
CREATE OR REPLACE FUNCTION transfer_asset(
    p_assignment_id UUID,
    p_new_user_id UUID,
    p_admin_id UUID,
    p_expected_return_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_purpose TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_condition TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_asset_id UUID;
    v_old_user_id UUID;
    v_assignment_status assignment_status;
    v_new_assignment_id UUID;
BEGIN
    -- Get assignment details
    SELECT asset_id, assigned_to, status INTO v_asset_id, v_old_user_id, v_assignment_status
    FROM asset_assignments
    WHERE id = p_assignment_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Assignment not found with ID: %', p_assignment_id;
    END IF;
    
    IF v_assignment_status != 'active' THEN
        RAISE EXCEPTION 'Assignment is not active. Current status: %', v_assignment_status;
    END IF;
    
    -- Close current assignment
    UPDATE asset_assignments
    SET 
        status = 'transferred',
        actual_return_date = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_assignment_id;
    
    -- Create new assignment
    INSERT INTO asset_assignments (
        asset_id,
        assigned_to,
        assigned_by,
        assignment_date,
        expected_return_date,
        status,
        purpose,
        notes,
        condition_on_assignment
    ) VALUES (
        v_asset_id,
        p_new_user_id,
        p_admin_id,
        CURRENT_TIMESTAMP,
        p_expected_return_date,
        'active',
        p_purpose,
        p_notes,
        p_condition
    ) RETURNING id INTO v_new_assignment_id;
    
    -- Generate transfer protocols
    -- Return protocol for previous user
    INSERT INTO protocols (
        reference_number,
        protocol_type,
        title,
        assignment_id,
        user_id,
        admin_id,
        asset_id,
        terms_and_conditions
    ) VALUES (
        'TRF-R-' || to_char(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || substring(p_assignment_id::text, 1, 8),
        'transfer',
        'Asset Transfer Return Protocol',
        p_assignment_id,
        v_old_user_id,
        p_admin_id,
        v_asset_id,
        (SELECT setting_value FROM system_settings WHERE setting_key = 'default_protocol_terms')
    );
    
    -- Assignment protocol for new user
    INSERT INTO protocols (
        reference_number,
        protocol_type,
        title,
        assignment_id,
        user_id,
        admin_id,
        asset_id,
        terms_and_conditions
    ) VALUES (
        'TRF-A-' || to_char(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || substring(v_new_assignment_id::text, 1, 8),
        'transfer',
        'Asset Transfer Assignment Protocol',
        v_new_assignment_id,
        p_new_user_id,
        p_admin_id,
        v_asset_id,
        (SELECT setting_value FROM system_settings WHERE setting_key = 'default_protocol_terms')
    );
    
    -- Create notifications
    -- Notification for previous user
    INSERT INTO notifications (
        user_id,
        notification_type,
        title,
        message,
        related_asset_id,
        related_assignment_id
    ) VALUES (
        v_old_user_id,
        'asset_return_confirmation',
        'Asset Transferred',
        'The asset has been transferred to another user: ' || (SELECT name FROM assets WHERE id = v_asset_id),
        v_asset_id,
        p_assignment_id
    );
    
    -- Notification for new user
    INSERT INTO notifications (
        user_id,
        notification_type,
        title,
        message,
        related_asset_id,
        related_assignment_id
    ) VALUES (
        p_new_user_id,
        'asset_assignment',
        'New Asset Transferred to You',
        'An asset has been transferred to you: ' || (SELECT name FROM assets WHERE id = v_asset_id),
        v_asset_id,
        v_new_assignment_id
    );
    
    RETURN v_new_assignment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check for upcoming returns and create reminders
CREATE OR REPLACE FUNCTION create_return_reminders()
RETURNS INTEGER AS $$
DECLARE
    v_assignment RECORD;
    v_count INTEGER := 0;
BEGIN
    -- Find assignments due in 7 days
    FOR v_assignment IN 
        SELECT aa.id, aa.asset_id, aa.assigned_to, a.name as asset_name, a.asset_tag
        FROM asset_assignments aa
        JOIN assets a ON aa.asset_id = a.id
        WHERE aa.status = 'active'
          AND aa.expected_return_date IS NOT NULL
          AND aa.expected_return_date BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '7 days'
          AND NOT EXISTS (
            SELECT 1 FROM notifications n 
            WHERE n.related_assignment_id = aa.id 
              AND n.notification_type = 'asset_return_reminder'
              AND n.created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
          )
    LOOP
        -- Create notification
        INSERT INTO notifications (
            user_id,
            notification_type,
            title,
            message,
            related_asset_id,
            related_assignment_id
        ) VALUES (
            v_assignment.assigned_to,
            'asset_return_reminder',
            'Asset Return Reminder',
            'Reminder: Asset ' || v_assignment.asset_name || ' (Tag: ' || v_assignment.asset_tag || ') is due to be returned soon.',
            v_assignment.asset_id,
            v_assignment.id
        );
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check for warranty expirations and create notifications
CREATE OR REPLACE FUNCTION create_warranty_notifications()
RETURNS INTEGER AS $$
DECLARE
    v_asset RECORD;
    v_admin_id UUID;
    v_count INTEGER := 0;
BEGIN
    -- Get admin ID for notifications
    SELECT id INTO v_admin_id FROM users WHERE role = 'admin' LIMIT 1;
    
    -- No admin found, exit
    IF v_admin_id IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Find assets with warranties expiring in 30, 60, and 90 days
    FOR v_asset IN 
        SELECT a.id, a.name, a.asset_tag, a.serial_number, a.warranty_end_date,
               a.warranty_end_date - CURRENT_DATE AS days_remaining
        FROM assets a
        WHERE a.warranty_end_date IS NOT NULL
          AND a.status != 'retired'
          AND (
              a.warranty_end_date = CURRENT_DATE + INTERVAL '30 days' OR
              a.warranty_end_date = CURRENT_DATE + INTERVAL '60 days' OR
              a.warranty_end_date = CURRENT_DATE + INTERVAL '90 days'
          )
          AND NOT EXISTS (
            SELECT 1 FROM notifications n 
            WHERE n.related_asset_id = a.id 
              AND n.notification_type = 'warranty_expiration'
              AND n.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
          )
    LOOP
        -- Create notification
        INSERT INTO notifications (
            user_id,
            notification_type,
            title,
            message,
            related_asset_id
        ) VALUES (
            v_admin_id,
            'warranty_expiration',
            'Warranty Expiration Alert',
            'Asset ' || v_asset.name || ' (Tag: ' || v_asset.asset_tag || ') warranty will expire in ' || v_asset.days_remaining || ' days.',
            v_asset.id
        );
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Create scheduled jobs
-- Note: In a production environment, these would typically be set up as cron jobs or using pgAgent
COMMENT ON FUNCTION create_return_reminders() IS 'This function should be scheduled to run daily';
COMMENT ON FUNCTION create_warranty_notifications() IS 'This function should be scheduled to run daily';

-- Grant appropriate permissions (in a production environment, you would use more specific roles)
-- GRANT USAGE ON SCHEMA cmdb TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA cmdb TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA cmdb TO your_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA cmdb TO your_app_user;

-- Commit the transaction
COMMIT;

-- Add helpful comment about initialization
COMMENT ON SCHEMA cmdb IS 'Schema for InvenTrack Configuration Management Database (CMDB) application. Initialize the application by running this script.';

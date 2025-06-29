-- Script to add the department_users table to an existing database
SET search_path TO cmdb, public;

-- Department Users (join table for many-to-many relationship)
CREATE TABLE IF NOT EXISTS department_users (
    id SERIAL PRIMARY KEY,
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(department_id, user_id)
);

-- Create indexes for department_users
CREATE INDEX IF NOT EXISTS idx_department_users_department_id ON department_users(department_id);
CREATE INDEX IF NOT EXISTS idx_department_users_user_id ON department_users(user_id);

-- Report success
SELECT 'Department_users table created successfully!' as result;

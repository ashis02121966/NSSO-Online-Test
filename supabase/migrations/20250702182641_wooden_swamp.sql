/*
  # eSigma Survey Platform - Complete Database Schema
  
  1. New Tables
    - `roles` - Role-based access control
    - `permissions` - System permissions
    - `role_permissions` - Role-permission mapping
    - `users` - User accounts with hierarchy
    - `surveys` - Survey definitions
    - `survey_sections` - Survey sections
    - `questions` - Survey questions
    - `question_options` - Question answer options
    - `test_sessions` - Active test sessions
    - `test_answers` - User test answers
    - `test_results` - Test results and scores
    - `section_scores` - Section-wise performance
    - `certificates` - Generated certificates
    - `survey_assignments` - Survey assignments to users/groups
    - `system_settings` - System configuration
    - `activity_logs` - Audit trail
    - `capi_sync_status` - CAPI integration status
    - `notifications` - User notifications

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for data access
    - Create indexes for performance
    - Add triggers for automatic updates
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Roles table for role-based access control
CREATE TABLE IF NOT EXISTS roles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name varchar(100) NOT NULL UNIQUE,
    description text,
    level integer NOT NULL DEFAULT 5, -- 1=Admin, 2=ZO, 3=RO, 4=Supervisor, 5=Enumerator
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name varchar(100) NOT NULL,
    resource varchar(50) NOT NULL,
    action varchar(50) NOT NULL,
    description text,
    module varchar(50) NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(resource, action)
);

-- Role permissions mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(role_id, permission_id)
);

-- Users table with hierarchical structure
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email varchar(255) NOT NULL UNIQUE,
    password_hash varchar(255) NOT NULL,
    name varchar(255) NOT NULL,
    role_id uuid NOT NULL REFERENCES roles(id),
    employee_id varchar(50) UNIQUE,
    phone_number varchar(20),
    profile_image varchar(500),
    parent_id uuid REFERENCES users(id) ON DELETE SET NULL,
    zone varchar(100),
    region varchar(100),
    district varchar(100),
    jurisdiction text,
    is_active boolean DEFAULT true,
    last_login timestamptz,
    email_verified_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- SURVEY AND QUESTION MANAGEMENT
-- =====================================================

-- Surveys table
CREATE TABLE IF NOT EXISTS surveys (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    title varchar(255) NOT NULL,
    description text,
    target_date date NOT NULL,
    duration integer NOT NULL DEFAULT 35, -- in minutes
    total_questions integer NOT NULL DEFAULT 30,
    passing_score integer NOT NULL DEFAULT 70,
    max_attempts integer NOT NULL DEFAULT 3,
    is_active boolean DEFAULT true,
    created_by uuid NOT NULL REFERENCES users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Survey sections
CREATE TABLE IF NOT EXISTS survey_sections (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    title varchar(255) NOT NULL,
    description text,
    questions_count integer NOT NULL DEFAULT 10,
    section_order integer NOT NULL DEFAULT 1,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id uuid NOT NULL REFERENCES survey_sections(id) ON DELETE CASCADE,
    text text NOT NULL,
    type varchar(20) NOT NULL DEFAULT 'single_choice' CHECK (type IN ('single_choice', 'multiple_choice')),
    complexity varchar(10) NOT NULL DEFAULT 'medium' CHECK (complexity IN ('easy', 'medium', 'hard')),
    explanation text,
    points integer NOT NULL DEFAULT 1,
    question_order integer NOT NULL DEFAULT 1,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Question options
CREATE TABLE IF NOT EXISTS question_options (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text text NOT NULL,
    is_correct boolean DEFAULT false,
    option_order integer NOT NULL DEFAULT 1,
    created_at timestamptz DEFAULT now()
);

-- =====================================================
-- TEST SESSIONS AND RESULTS
-- =====================================================

-- Test sessions for tracking ongoing tests
CREATE TABLE IF NOT EXISTS test_sessions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    survey_id uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    start_time timestamptz DEFAULT now(),
    end_time timestamptz,
    time_remaining integer NOT NULL, -- in seconds
    current_question_index integer DEFAULT 0,
    status varchar(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'timeout', 'paused')),
    attempt_number integer NOT NULL DEFAULT 1,
    ip_address inet,
    user_agent text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Test answers for tracking user responses
CREATE TABLE IF NOT EXISTS test_answers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id uuid NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_options jsonb, -- Array of selected option IDs
    is_correct boolean DEFAULT false,
    time_spent integer DEFAULT 0, -- in seconds
    answered boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(session_id, question_id)
);

-- Test results
CREATE TABLE IF NOT EXISTS test_results (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    survey_id uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    session_id uuid NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
    score decimal(5,2) NOT NULL DEFAULT 0.00,
    total_questions integer NOT NULL,
    correct_answers integer NOT NULL DEFAULT 0,
    is_passed boolean DEFAULT false,
    time_spent integer NOT NULL DEFAULT 0, -- in seconds
    attempt_number integer NOT NULL DEFAULT 1,
    grade varchar(5), -- A, B, C, D, F
    completed_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- Section-wise scores
CREATE TABLE IF NOT EXISTS section_scores (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    result_id uuid NOT NULL REFERENCES test_results(id) ON DELETE CASCADE,
    section_id uuid NOT NULL REFERENCES survey_sections(id) ON DELETE CASCADE,
    section_title varchar(255) NOT NULL,
    score decimal(5,2) NOT NULL DEFAULT 0.00,
    total_questions integer NOT NULL,
    correct_answers integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- =====================================================
-- CERTIFICATES
-- =====================================================

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    survey_id uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    result_id uuid NOT NULL REFERENCES test_results(id) ON DELETE CASCADE,
    certificate_number varchar(100) NOT NULL UNIQUE,
    issued_at timestamptz DEFAULT now(),
    valid_until date,
    download_count integer DEFAULT 0,
    status varchar(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
    revoked_at timestamptz,
    revoked_by uuid REFERENCES users(id) ON DELETE SET NULL,
    revocation_reason text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- SURVEY ASSIGNMENTS
-- =====================================================

-- Survey assignments to users/groups
CREATE TABLE IF NOT EXISTS survey_assignments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    zone varchar(100),
    region varchar(100),
    district varchar(100),
    role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by uuid NOT NULL REFERENCES users(id),
    assigned_at timestamptz DEFAULT now(),
    target_date date NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- =====================================================
-- SYSTEM SETTINGS
-- =====================================================

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    category varchar(50) NOT NULL,
    setting_key varchar(100) NOT NULL,
    setting_value text,
    description text,
    data_type varchar(20) DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    is_editable boolean DEFAULT true,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(category, setting_key)
);

-- =====================================================
-- ACTIVITY LOGS
-- =====================================================

-- Activity logs for audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    activity_type varchar(50) NOT NULL,
    description text NOT NULL,
    metadata jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

-- =====================================================
-- CAPI INTEGRATION
-- =====================================================

-- CAPI sync status for offline application integration
CREATE TABLE IF NOT EXISTS capi_sync_status (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    survey_id uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    sync_status varchar(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
    last_sync_at timestamptz,
    sync_data jsonb,
    error_message text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, survey_id)
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title varchar(255) NOT NULL,
    message text NOT NULL,
    type varchar(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    is_read boolean DEFAULT false,
    action_url varchar(500),
    metadata jsonb,
    created_at timestamptz DEFAULT now(),
    read_at timestamptz
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Roles indexes
CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);
CREATE INDEX IF NOT EXISTS idx_roles_active ON roles(is_active);

-- Permissions indexes
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_parent ON users(parent_id);
CREATE INDEX IF NOT EXISTS idx_users_zone ON users(zone);
CREATE INDEX IF NOT EXISTS idx_users_region ON users(region);
CREATE INDEX IF NOT EXISTS idx_users_district ON users(district);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Surveys indexes
CREATE INDEX IF NOT EXISTS idx_surveys_active ON surveys(is_active);
CREATE INDEX IF NOT EXISTS idx_surveys_target_date ON surveys(target_date);
CREATE INDEX IF NOT EXISTS idx_surveys_created_by ON surveys(created_by);

-- Survey sections indexes
CREATE INDEX IF NOT EXISTS idx_sections_survey ON survey_sections(survey_id);
CREATE INDEX IF NOT EXISTS idx_sections_order ON survey_sections(section_order);

-- Questions indexes
CREATE INDEX IF NOT EXISTS idx_questions_section ON questions(section_id);
CREATE INDEX IF NOT EXISTS idx_questions_complexity ON questions(complexity);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(is_active);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(question_order);

-- Question options indexes
CREATE INDEX IF NOT EXISTS idx_options_question ON question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_options_correct ON question_options(is_correct);
CREATE INDEX IF NOT EXISTS idx_options_order ON question_options(option_order);

-- Test sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user ON test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_survey ON test_sessions(survey_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON test_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_attempt ON test_sessions(attempt_number);

-- Test answers indexes
CREATE INDEX IF NOT EXISTS idx_answers_session ON test_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON test_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_correct ON test_answers(is_correct);

-- Test results indexes
CREATE INDEX IF NOT EXISTS idx_results_user ON test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_results_survey ON test_results(survey_id);
CREATE INDEX IF NOT EXISTS idx_results_passed ON test_results(is_passed);
CREATE INDEX IF NOT EXISTS idx_results_score ON test_results(score);
CREATE INDEX IF NOT EXISTS idx_results_completed ON test_results(completed_at);
CREATE INDEX IF NOT EXISTS idx_test_results_user_survey ON test_results(user_id, survey_id);
CREATE INDEX IF NOT EXISTS idx_test_results_survey_passed ON test_results(survey_id, is_passed);

-- Section scores indexes
CREATE INDEX IF NOT EXISTS idx_section_scores_result ON section_scores(result_id);
CREATE INDEX IF NOT EXISTS idx_section_scores_section ON section_scores(section_id);

-- Certificates indexes
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_survey ON certificates(survey_id);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificates_issued ON certificates(issued_at);
CREATE INDEX IF NOT EXISTS idx_certificates_user_status ON certificates(user_id, status);

-- Survey assignments indexes
CREATE INDEX IF NOT EXISTS idx_assignments_survey ON survey_assignments(survey_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user ON survey_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_zone ON survey_assignments(zone);
CREATE INDEX IF NOT EXISTS idx_assignments_region ON survey_assignments(region);
CREATE INDEX IF NOT EXISTS idx_assignments_district ON survey_assignments(district);
CREATE INDEX IF NOT EXISTS idx_assignments_role ON survey_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_assignments_target_date ON survey_assignments(target_date);
CREATE INDEX IF NOT EXISTS idx_survey_assignments_target ON survey_assignments(target_date, is_active);

-- System settings indexes
CREATE INDEX IF NOT EXISTS idx_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_settings_key ON system_settings(setting_key);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_logs_created ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_type ON activity_logs(user_id, activity_type);

-- CAPI sync status indexes
CREATE INDEX IF NOT EXISTS idx_capi_sync_user ON capi_sync_status(user_id);
CREATE INDEX IF NOT EXISTS idx_capi_sync_survey ON capi_sync_status(survey_id);
CREATE INDEX IF NOT EXISTS idx_capi_sync_status ON capi_sync_status(sync_status);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON surveys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_survey_sections_updated_at BEFORE UPDATE ON survey_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_sessions_updated_at BEFORE UPDATE ON test_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_answers_updated_at BEFORE UPDATE ON test_answers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_capi_sync_status_updated_at BEFORE UPDATE ON capi_sync_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE capi_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (simplified to avoid circular references)
CREATE POLICY "Enable read access for all users" ON roles FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON permissions FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON role_permissions FOR SELECT USING (true);
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can read surveys" ON surveys FOR SELECT USING (is_active = true);
CREATE POLICY "Users can read survey sections" ON survey_sections FOR SELECT USING (true);
CREATE POLICY "Users can read questions" ON questions FOR SELECT USING (is_active = true);
CREATE POLICY "Users can read question options" ON question_options FOR SELECT USING (true);
CREATE POLICY "Users can access own sessions" ON test_sessions FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can access session answers" ON test_answers FOR ALL USING (
    EXISTS (SELECT 1 FROM test_sessions WHERE id = test_answers.session_id AND user_id::text = auth.uid()::text)
);
CREATE POLICY "Users can view own results" ON test_results FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view section scores" ON section_scores FOR SELECT USING (
    EXISTS (SELECT 1 FROM test_results WHERE id = section_scores.result_id AND user_id::text = auth.uid()::text)
);
CREATE POLICY "Users can view own certificates" ON certificates FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view assignments" ON survey_assignments FOR SELECT USING (
    auth.uid()::text = user_id::text OR user_id IS NULL
);
CREATE POLICY "Users can read settings" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Users can create logs" ON activity_logs FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can read own sync status" ON capi_sync_status FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can access own notifications" ON notifications FOR ALL USING (auth.uid()::text = user_id::text);

-- =====================================================
-- INITIAL DATA INSERTION
-- =====================================================

-- Insert default roles
INSERT INTO roles (id, name, description, level) VALUES
('11111111-1111-1111-1111-111111111111', 'Admin', 'System Administrator with full access', 1),
('22222222-2222-2222-2222-222222222222', 'ZO User', 'Zonal Office User with zone-level access', 2),
('33333333-3333-3333-3333-333333333333', 'RO User', 'Regional Office User with region-level access', 3),
('44444444-4444-4444-4444-444444444444', 'Supervisor', 'Field Supervisor with team management access', 4),
('55555555-5555-5555-5555-555555555555', 'Enumerator', 'Field Enumerator with test access', 5)
ON CONFLICT (id) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (id, name, resource, action, description, module) VALUES
('p1111111-1111-1111-1111-111111111111', 'Create Users', 'users', 'create', 'Create new users', 'user_management'),
('p2222222-2222-2222-2222-222222222222', 'View Users', 'users', 'read', 'View user information', 'user_management'),
('p3333333-3333-3333-3333-333333333333', 'Edit Users', 'users', 'update', 'Edit existing users', 'user_management'),
('p4444444-4444-4444-4444-444444444444', 'Delete Users', 'users', 'delete', 'Delete users', 'user_management'),
('p5555555-5555-5555-5555-555555555555', 'Create Surveys', 'surveys', 'create', 'Create new surveys', 'survey_management'),
('p6666666-6666-6666-6666-666666666666', 'View Surveys', 'surveys', 'read', 'View survey information', 'survey_management'),
('p7777777-7777-7777-7777-777777777777', 'Edit Surveys', 'surveys', 'update', 'Edit existing surveys', 'survey_management'),
('p8888888-8888-8888-8888-888888888888', 'Delete Surveys', 'surveys', 'delete', 'Delete surveys', 'survey_management'),
('p9999999-9999-9999-9999-999999999999', 'View Results', 'results', 'read', 'View test results', 'analytics'),
('pa111111-1111-1111-1111-111111111111', 'Export Results', 'results', 'export', 'Export test results', 'analytics'),
('pb222222-2222-2222-2222-222222222222', 'Manage Certificates', 'certificates', 'manage', 'Issue and revoke certificates', 'certificates'),
('pc333333-3333-3333-3333-333333333333', 'Take Tests', 'tests', 'take', 'Take assigned tests', 'testing'),
('pd444444-4444-4444-4444-444444444444', 'View Dashboard', 'dashboard', 'view', 'View dashboard analytics', 'analytics')
ON CONFLICT (resource, action) DO NOTHING;

-- Assign all permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111111', id FROM permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign specific permissions to other roles
INSERT INTO role_permissions (role_id, permission_id) VALUES
-- ZO User permissions
('22222222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222'),
('22222222-2222-2222-2222-222222222222', 'p6666666-6666-6666-6666-666666666666'),
('22222222-2222-2222-2222-222222222222', 'p9999999-9999-9999-9999-999999999999'),
('22222222-2222-2222-2222-222222222222', 'pa111111-1111-1111-1111-111111111111'),
('22222222-2222-2222-2222-222222222222', 'pd444444-4444-4444-4444-444444444444'),
-- RO User permissions
('33333333-3333-3333-3333-333333333333', 'p2222222-2222-2222-2222-222222222222'),
('33333333-3333-3333-3333-333333333333', 'p6666666-6666-6666-6666-666666666666'),
('33333333-3333-3333-3333-333333333333', 'p9999999-9999-9999-9999-999999999999'),
('33333333-3333-3333-3333-333333333333', 'pa111111-1111-1111-1111-111111111111'),
('33333333-3333-3333-3333-333333333333', 'pd444444-4444-4444-4444-444444444444'),
-- Supervisor permissions
('44444444-4444-4444-4444-444444444444', 'p2222222-2222-2222-2222-222222222222'),
('44444444-4444-4444-4444-444444444444', 'p6666666-6666-6666-6666-666666666666'),
('44444444-4444-4444-4444-444444444444', 'p9999999-9999-9999-9999-999999999999'),
('44444444-4444-4444-4444-444444444444', 'pd444444-4444-4444-4444-444444444444'),
-- Enumerator permissions
('55555555-5555-5555-5555-555555555555', 'pc333333-3333-3333-3333-333333333333'),
('55555555-5555-5555-5555-555555555555', 'p9999999-9999-9999-9999-999999999999'),
('55555555-5555-5555-5555-555555555555', 'pb222222-2222-2222-2222-222222222222')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (category, setting_key, setting_value, description, data_type) VALUES
('general', 'site_name', 'eSigma Survey Platform', 'Name of the application', 'string'),
('general', 'site_description', 'Online MCQ Test Management System', 'Description of the application', 'string'),
('test', 'default_test_duration', '35', 'Default test duration in minutes', 'number'),
('test', 'default_passing_score', '70', 'Default passing score percentage', 'number'),
('test', 'max_attempts', '3', 'Maximum number of test attempts allowed', 'number'),
('test', 'auto_submit_on_timeout', 'true', 'Automatically submit test when time expires', 'boolean'),
('security', 'session_timeout', '30', 'Session timeout in minutes', 'number'),
('security', 'password_min_length', '8', 'Minimum password length', 'number'),
('email', 'smtp_enabled', 'false', 'Enable email notifications', 'boolean'),
('certificate', 'auto_generate', 'true', 'Automatically generate certificates for passed tests', 'boolean'),
('certificate', 'validity_period', '365', 'Certificate validity period in days', 'number')
ON CONFLICT (category, setting_key) DO NOTHING;
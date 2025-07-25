/*
  # Insert Initial Data

  1. Default Roles
    - Admin, ZO User, RO User, Supervisor, Enumerator

  2. Default Admin User
    - System administrator account

  3. System Settings
    - Default configuration values

  4. Sample Survey Data
    - Digital Literacy Assessment
*/

-- Insert default roles
INSERT INTO roles (id, name, description, level, menu_access) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Admin', 'System Administrator with full access to all features', 1, 
   ARRAY['/dashboard', '/users', '/roles', '/role-menu-management', '/surveys', '/questions', '/results', '/enumerator-status', '/certificates', '/settings']),
  ('550e8400-e29b-41d4-a716-446655440002', 'ZO User', 'Zonal Office User with zone-level management access', 2, 
   ARRAY['/zo-dashboard', '/results', '/enumerator-status', '/certificates']),
  ('550e8400-e29b-41d4-a716-446655440003', 'RO User', 'Regional Office User with regional management access', 3, 
   ARRAY['/ro-dashboard', '/results', '/enumerator-status', '/certificates']),
  ('550e8400-e29b-41d4-a716-446655440004', 'Supervisor', 'Field Supervisor with team management capabilities', 4, 
   ARRAY['/supervisor-dashboard', '/team-results', '/my-enumerators', '/results', '/enumerator-status', '/certificates']),
  ('550e8400-e29b-41d4-a716-446655440005', 'Enumerator', 'Field Enumerator with test-taking access', 5, 
   ARRAY['/enumerator-dashboard', '/available-tests', '/my-results', '/my-certificates', '/test-schedule'])
ON CONFLICT (id) DO NOTHING;

-- Insert default admin user (password: password123)
INSERT INTO users (id, email, password_hash, name, role_id, jurisdiction, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', 'admin@esigma.com', '$2b$10$rOvHPGkwQGKnlqshd.LfUeJ/Gf.xQ5cQNQfL8p8qGf.xQ5cQNQfL8', 'System Administrator', '550e8400-e29b-41d4-a716-446655440001', 'National', true),
  ('550e8400-e29b-41d4-a716-446655440011', 'zo@esigma.com', '$2b$10$rOvHPGkwQGKnlqshd.LfUeJ/Gf.xQ5cQNQfL8p8qGf.xQ5cQNQfL8', 'Zonal Officer', '550e8400-e29b-41d4-a716-446655440002', 'North Zone', true),
  ('550e8400-e29b-41d4-a716-446655440012', 'ro@esigma.com', '$2b$10$rOvHPGkwQGKnlqshd.LfUeJ/Gf.xQ5cQNQfL8p8qGf.xQ5cQNQfL8', 'Regional Officer', '550e8400-e29b-41d4-a716-446655440003', 'Delhi Region', true),
  ('550e8400-e29b-41d4-a716-446655440013', 'supervisor@esigma.com', '$2b$10$rOvHPGkwQGKnlqshd.LfUeJ/Gf.xQ5cQNQfL8p8qGf.xQ5cQNQfL8', 'Field Supervisor', '550e8400-e29b-41d4-a716-446655440004', 'Central Delhi District', true),
  ('550e8400-e29b-41d4-a716-446655440014', 'enumerator@esigma.com', '$2b$10$rOvHPGkwQGKnlqshd.LfUeJ/Gf.xQ5cQNQfL8p8qGf.xQ5cQNQfL8', 'Field Enumerator', '550e8400-e29b-41d4-a716-446655440005', 'Block A, Central Delhi', true)
ON CONFLICT (id) DO NOTHING;

-- Insert system settings
INSERT INTO system_settings (category, setting_key, setting_value, description, setting_type, is_editable) VALUES
  -- Security Settings
  ('security', 'max_login_attempts', '5', 'Maximum number of failed login attempts before account lockout', 'number', true),
  ('security', 'account_lockout_duration', '30', 'Account lockout duration in minutes after max failed attempts', 'number', true),
  ('security', 'session_timeout', '120', 'User session timeout in minutes', 'number', true),
  ('security', 'password_min_length', '8', 'Minimum password length requirement', 'number', true),
  ('security', 'require_password_complexity', 'true', 'Require uppercase, lowercase, numbers, and special characters in passwords', 'boolean', true),
  ('security', 'force_password_change', '90', 'Force password change every X days (0 to disable)', 'number', true),
  
  -- Test Settings
  ('test', 'auto_save_interval', '30', 'Auto-save test progress interval in seconds', 'number', true),
  ('test', 'enable_auto_save', 'true', 'Enable automatic saving of test progress', 'boolean', true),
  ('test', 'auto_submit_on_timeout', 'true', 'Automatically submit test when time expires', 'boolean', true),
  ('test', 'show_time_warning', 'true', 'Show warning when 5 minutes remaining', 'boolean', true),
  ('test', 'allow_question_navigation', 'true', 'Allow users to navigate between questions during test', 'boolean', true),
  ('test', 'show_question_numbers', 'true', 'Show question numbers to users during test', 'boolean', true),
  ('test', 'enable_question_flagging', 'true', 'Allow users to flag questions for review', 'boolean', true),
  ('test', 'network_pause_enabled', 'true', 'Automatically pause test when network is unavailable', 'boolean', true),
  
  -- General Settings
  ('general', 'site_name', 'eSigma Survey Platform', 'Name of the application displayed in headers and titles', 'string', true),
  ('general', 'site_description', 'Online MCQ Test Management System', 'Description of the application', 'string', true),
  ('general', 'support_email', 'support@esigma.com', 'Support email address for user assistance', 'email', true),
  ('general', 'maintenance_mode', 'false', 'Enable maintenance mode to restrict access', 'boolean', true),
  ('general', 'default_timezone', 'Asia/Kolkata', 'Default timezone for the application', 'string', true),
  ('general', 'date_format', 'DD/MM/YYYY', 'Default date format for display', 'string', true)
ON CONFLICT (category, setting_key) DO NOTHING;

-- Insert sample survey
INSERT INTO surveys (id, title, description, target_date, duration, total_questions, passing_score, max_attempts, created_by) VALUES
  ('550e8400-e29b-41d4-a716-446655440020', 'Digital Literacy Assessment', 'Comprehensive assessment of digital skills and computer literacy for field enumerators', CURRENT_DATE + INTERVAL '30 days', 35, 30, 70, 3, '550e8400-e29b-41d4-a716-446655440010')
ON CONFLICT (id) DO NOTHING;

-- Insert survey sections
INSERT INTO survey_sections (id, survey_id, title, description, questions_count, section_order) VALUES
  ('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440020', 'Basic Computer Skills', 'Fundamental computer operations and software usage', 10, 1),
  ('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440020', 'Internet and Digital Communication', 'Web browsing, email, and online communication tools', 10, 2),
  ('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440020', 'Digital Security and Privacy', 'Online safety, password management, and privacy protection', 10, 3)
ON CONFLICT (id) DO NOTHING;
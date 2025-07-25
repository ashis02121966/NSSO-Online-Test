/*
  # Initial Database Schema for eSigma Survey Platform

  1. New Tables
    - `roles` - User roles with hierarchical levels
    - `users` - User accounts with role-based access
    - `surveys` - Survey/test definitions
    - `survey_sections` - Sections within surveys
    - `questions` - Individual questions
    - `question_options` - Multiple choice options
    - `test_sessions` - Active test sessions
    - `test_answers` - User responses to questions
    - `test_results` - Final test results
    - `section_scores` - Section-wise performance
    - `certificates` - Generated certificates
    - `system_settings` - Configurable system parameters
    - `activity_logs` - Audit trail

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Secure user data access

  3. Indexes
    - Performance optimization indexes
    - Foreign key constraints
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  level INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  menu_access TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id),
  is_active BOOLEAN DEFAULT true,
  jurisdiction VARCHAR(255),
  zone VARCHAR(255),
  region VARCHAR(255),
  district VARCHAR(255),
  employee_id VARCHAR(100),
  phone_number VARCHAR(20),
  profile_image TEXT,
  parent_id UUID REFERENCES users(id),
  last_login TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ DEFAULT NOW(),
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create surveys table
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_date DATE NOT NULL,
  duration INTEGER NOT NULL DEFAULT 35,
  total_questions INTEGER NOT NULL DEFAULT 30,
  passing_score INTEGER NOT NULL DEFAULT 70,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  assigned_zones TEXT[] DEFAULT '{}',
  assigned_regions TEXT[] DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create survey_sections table
CREATE TABLE IF NOT EXISTS survey_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  questions_count INTEGER NOT NULL DEFAULT 10,
  section_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES survey_sections(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('single_choice', 'multiple_choice')),
  complexity VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (complexity IN ('easy', 'medium', 'hard')),
  points INTEGER NOT NULL DEFAULT 1,
  explanation TEXT,
  question_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create question_options table
CREATE TABLE IF NOT EXISTS question_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  option_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create test_sessions table
CREATE TABLE IF NOT EXISTS test_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  survey_id UUID NOT NULL REFERENCES surveys(id),
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  time_remaining INTEGER NOT NULL,
  current_question_index INTEGER DEFAULT 0,
  session_status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (session_status IN ('in_progress', 'completed', 'timeout', 'paused')),
  attempt_number INTEGER NOT NULL DEFAULT 1,
  score DECIMAL(5,2),
  is_passed BOOLEAN,
  completed_at TIMESTAMPTZ,
  pause_time TIMESTAMPTZ,
  resume_time TIMESTAMPTZ,
  total_pause_duration INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create test_answers table
CREATE TABLE IF NOT EXISTS test_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  selected_options UUID[] DEFAULT '{}',
  is_correct BOOLEAN DEFAULT false,
  time_spent INTEGER DEFAULT 0,
  answered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, question_id)
);

-- Create test_results table
CREATE TABLE IF NOT EXISTS test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  survey_id UUID NOT NULL REFERENCES surveys(id),
  session_id UUID NOT NULL REFERENCES test_sessions(id),
  score DECIMAL(5,2) NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  is_passed BOOLEAN NOT NULL,
  time_spent INTEGER NOT NULL,
  attempt_number INTEGER NOT NULL,
  grade VARCHAR(2),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  certificate_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create section_scores table
CREATE TABLE IF NOT EXISTS section_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  result_id UUID NOT NULL REFERENCES test_results(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES survey_sections(id),
  section_title VARCHAR(255) NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  survey_id UUID NOT NULL REFERENCES surveys(id),
  result_id UUID NOT NULL REFERENCES test_results(id),
  certificate_number VARCHAR(100) UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until DATE,
  download_count INTEGER DEFAULT 0,
  certificate_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (certificate_status IN ('active', 'revoked', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(50) NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  setting_type VARCHAR(20) NOT NULL DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json', 'email', 'url', 'color', 'select')),
  is_editable BOOLEAN DEFAULT true,
  options TEXT[],
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  UNIQUE(category, setting_key)
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  activity_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_parent_id ON users(parent_id);
CREATE INDEX IF NOT EXISTS idx_surveys_created_by ON surveys(created_by);
CREATE INDEX IF NOT EXISTS idx_survey_sections_survey_id ON survey_sections(survey_id);
CREATE INDEX IF NOT EXISTS idx_questions_section_id ON questions(section_id);
CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_user_id ON test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_survey_id ON test_sessions(survey_id);
CREATE INDEX IF NOT EXISTS idx_test_answers_session_id ON test_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_survey_id ON test_results(survey_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- RLS Policies

-- Roles policies
CREATE POLICY "Admins can manage all roles" ON roles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = auth.uid() AND r.level = 1
    )
  );

CREATE POLICY "Users can view roles" ON roles
  FOR SELECT TO authenticated
  USING (true);

-- Users policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = auth.uid() AND r.level = 1
    )
  );

CREATE POLICY "Supervisors can view their team" ON users
  FOR SELECT TO authenticated
  USING (
    parent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = auth.uid() AND r.level <= 4
    )
  );

-- Surveys policies
CREATE POLICY "Admins can manage surveys" ON surveys
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = auth.uid() AND r.level = 1
    )
  );

CREATE POLICY "Users can view assigned surveys" ON surveys
  FOR SELECT TO authenticated
  USING (
    is_active = true AND (
      EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = auth.uid() AND (
          u.zone = ANY(assigned_zones) OR 
          u.region = ANY(assigned_regions) OR
          array_length(assigned_zones, 1) IS NULL
        )
      )
    )
  );

-- Test sessions policies
CREATE POLICY "Users can manage their own sessions" ON test_sessions
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Supervisors can view team sessions" ON test_sessions
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = user_id AND u.parent_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = auth.uid() AND r.level <= 3
    )
  );

-- Test answers policies
CREATE POLICY "Users can manage their own answers" ON test_answers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts 
      WHERE ts.id = session_id AND ts.user_id = auth.uid()
    )
  );

-- Test results policies
CREATE POLICY "Users can view their own results" ON test_results
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Supervisors can view team results" ON test_results
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = user_id AND u.parent_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = auth.uid() AND r.level <= 3
    )
  );

-- Certificates policies
CREATE POLICY "Users can view their own certificates" ON certificates
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Supervisors can view team certificates" ON certificates
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = user_id AND u.parent_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = auth.uid() AND r.level <= 3
    )
  );

-- System settings policies
CREATE POLICY "Admins can manage settings" ON system_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = auth.uid() AND r.level = 1
    )
  );

-- Activity logs policies
CREATE POLICY "Admins can view all logs" ON activity_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = auth.uid() AND r.level = 1
    )
  );

CREATE POLICY "Users can view their own logs" ON activity_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
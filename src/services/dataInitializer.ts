import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';

export class DataInitializer {
  static async initializeDatabase() {
    try {
      console.log('Starting database initialization...');
      
      // Use the existing supabase client
      const supabaseAdmin = supabase;
      
      // Check if data already exists
      const { data: existingRoles } = await supabaseAdmin
        .from('roles')
        .select('id')
        .limit(1);
      
      if (existingRoles && existingRoles.length > 0) {
        console.log('Database already initialized');
        return { success: true, message: 'Database already contains data' };
      }

      // Initialize in order: roles -> users -> surveys -> sections -> questions -> settings
      await this.createRoles(supabaseAdmin);
      await this.createUsers(supabaseAdmin);
      await this.createSurveys(supabaseAdmin);
      await this.createSurveySections(supabaseAdmin);
      await this.createQuestions(supabaseAdmin);
      await this.createSystemSettings(supabaseAdmin);
      
      console.log('Database initialization completed successfully');
      return { success: true, message: 'Database initialized successfully' };
    } catch (error) {
      console.error('Database initialization failed:', error);
      return { success: false, message: 'Failed to initialize database', error };
    }
  }

  static async createRoles(supabaseClient: any) {
    console.log('Creating roles...');
    
    const roles = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Admin',
        description: 'System Administrator with full access',
        level: 1,
        is_active: true,
        menu_access: [
          '/dashboard', '/users', '/roles', '/role-menu-management', 
          '/surveys', '/questions', '/results', '/enumerator-status', 
          '/certificates', '/settings'
        ]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'ZO User',
        description: 'Zonal Office User',
        level: 2,
        is_active: true,
        menu_access: [
          '/zo-dashboard', '/results', '/enumerator-status', '/certificates'
        ]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'RO User',
        description: 'Regional Office User',
        level: 3,
        is_active: true,
        menu_access: [
          '/ro-dashboard', '/results', '/enumerator-status', '/certificates'
        ]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'Supervisor',
        description: 'Field Supervisor',
        level: 4,
        is_active: true,
        menu_access: [
          '/supervisor-dashboard', '/team-results', '/my-enumerators', 
          '/enumerator-status', '/certificates'
        ]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        name: 'Enumerator',
        description: 'Field Enumerator',
        level: 5,
        is_active: true,
        menu_access: [
          '/enumerator-dashboard', '/available-tests', '/my-results', 
          '/my-certificates', '/test-schedule'
        ]
      }
    ];

    const { error } = await supabaseClient
      .from('roles')
      .insert(roles);

    if (error) throw error;
    console.log('Roles created successfully');
  }

  static async createUsers(supabaseClient: any) {
    console.log('Creating users...');
    
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const users = [
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        email: 'admin@esigma.com',
        password_hash: passwordHash,
        name: 'System Administrator',
        role_id: '550e8400-e29b-41d4-a716-446655440001',
        is_active: true,
        jurisdiction: 'National',
        zone: null,
        region: null,
        district: null,
        employee_id: 'ADM001',
        phone_number: '+91-9876543210'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        email: 'zo@esigma.com',
        password_hash: passwordHash,
        name: 'Zonal Officer',
        role_id: '550e8400-e29b-41d4-a716-446655440002',
        is_active: true,
        jurisdiction: 'North Zone',
        zone: 'North Zone',
        region: null,
        district: null,
        employee_id: 'ZO001',
        phone_number: '+91-9876543211'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440012',
        email: 'ro@esigma.com',
        password_hash: passwordHash,
        name: 'Regional Officer',
        role_id: '550e8400-e29b-41d4-a716-446655440003',
        is_active: true,
        jurisdiction: 'Delhi Region',
        zone: 'North Zone',
        region: 'Delhi Region',
        district: null,
        employee_id: 'RO001',
        phone_number: '+91-9876543212'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440013',
        email: 'supervisor@esigma.com',
        password_hash: passwordHash,
        name: 'Field Supervisor',
        role_id: '550e8400-e29b-41d4-a716-446655440004',
        is_active: true,
        jurisdiction: 'Central Delhi District',
        zone: 'North Zone',
        region: 'Delhi Region',
        district: 'Central Delhi',
        employee_id: 'SUP001',
        phone_number: '+91-9876543213',
        parent_id: '550e8400-e29b-41d4-a716-446655440012'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440014',
        email: 'enumerator@esigma.com',
        password_hash: passwordHash,
        name: 'Field Enumerator',
        role_id: '550e8400-e29b-41d4-a716-446655440005',
        is_active: true,
        jurisdiction: 'Block A, Central Delhi',
        zone: 'North Zone',
        region: 'Delhi Region',
        district: 'Central Delhi',
        employee_id: 'ENU001',
        phone_number: '+91-9876543214',
        parent_id: '550e8400-e29b-41d4-a716-446655440013'
      }
    ];

    const { error } = await supabaseClient
      .from('users')
      .insert(users);

    if (error) throw error;
    console.log('Users created successfully');
  }

  static async createSurveys(supabaseClient: any) {
    console.log('Creating surveys...');
    
    const surveys = [
      {
        id: '550e8400-e29b-41d4-a716-446655440020',
        title: 'Digital Literacy Assessment',
        description: 'Comprehensive assessment of digital skills and computer literacy for field staff',
        target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: 35,
        total_questions: 30,
        passing_score: 70,
        max_attempts: 3,
        is_active: true,
        assigned_zones: ['North Zone', 'South Zone'],
        assigned_regions: ['Delhi Region', 'Mumbai Region'],
        created_by: '550e8400-e29b-41d4-a716-446655440010'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440021',
        title: 'Data Collection Procedures',
        description: 'Assessment of field data collection methods and procedures',
        target_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: 40,
        total_questions: 25,
        passing_score: 75,
        max_attempts: 2,
        is_active: true,
        assigned_zones: ['North Zone'],
        assigned_regions: ['Delhi Region'],
        created_by: '550e8400-e29b-41d4-a716-446655440010'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440022',
        title: 'Survey Methodology Training',
        description: 'Training assessment on survey methodology and best practices',
        target_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: 30,
        total_questions: 20,
        passing_score: 80,
        max_attempts: 3,
        is_active: true,
        assigned_zones: ['North Zone', 'South Zone', 'East Zone'],
        assigned_regions: ['Delhi Region', 'Mumbai Region', 'Kolkata Region'],
        created_by: '550e8400-e29b-41d4-a716-446655440010'
      }
    ];

    const { error } = await supabaseClient
      .from('surveys')
      .insert(surveys);

    if (error) throw error;
    console.log('Surveys created successfully');
  }

  static async createSurveySections(supabaseClient: any) {
    console.log('Creating survey sections...');
    
    const sections = [
      // Digital Literacy Assessment sections
      {
        id: '550e8400-e29b-41d4-a716-446655440030',
        survey_id: '550e8400-e29b-41d4-a716-446655440020',
        title: 'Basic Computer Skills',
        description: 'Fundamental computer operations and software usage',
        questions_count: 10,
        section_order: 1
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440031',
        survey_id: '550e8400-e29b-41d4-a716-446655440020',
        title: 'Internet and Digital Communication',
        description: 'Web browsing, email, and online communication tools',
        questions_count: 10,
        section_order: 2
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440032',
        survey_id: '550e8400-e29b-41d4-a716-446655440020',
        title: 'Digital Security and Privacy',
        description: 'Online safety, password management, and privacy protection',
        questions_count: 10,
        section_order: 3
      },
      // Data Collection Procedures sections
      {
        id: '550e8400-e29b-41d4-a716-446655440033',
        survey_id: '550e8400-e29b-41d4-a716-446655440021',
        title: 'Field Data Collection',
        description: 'Methods and procedures for collecting data in the field',
        questions_count: 15,
        section_order: 1
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440034',
        survey_id: '550e8400-e29b-41d4-a716-446655440021',
        title: 'Data Quality Assurance',
        description: 'Ensuring accuracy and completeness of collected data',
        questions_count: 10,
        section_order: 2
      }
    ];

    const { error } = await supabaseClient
      .from('survey_sections')
      .insert(sections);

    if (error) throw error;
    console.log('Survey sections created successfully');
  }

  static async createQuestions(supabaseClient: any) {
    console.log('Creating sample questions...');
    
    const questions = [
      {
        id: '550e8400-e29b-41d4-a716-446655440040',
        section_id: '550e8400-e29b-41d4-a716-446655440030',
        text: 'What is the primary function of an operating system?',
        question_type: 'single_choice',
        complexity: 'easy',
        points: 1,
        explanation: 'An operating system manages all hardware and software resources of a computer.',
        question_order: 1
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440041',
        section_id: '550e8400-e29b-41d4-a716-446655440030',
        text: 'Which of the following are input devices? (Select all that apply)',
        question_type: 'multiple_choice',
        complexity: 'medium',
        points: 2,
        explanation: 'Input devices allow users to provide data to the computer. Monitor is an output device.',
        question_order: 2
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440042',
        section_id: '550e8400-e29b-41d4-a716-446655440031',
        text: 'What does URL stand for?',
        question_type: 'single_choice',
        complexity: 'easy',
        points: 1,
        explanation: 'URL stands for Uniform Resource Locator, which is the address of a web page.',
        question_order: 1
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440043',
        section_id: '550e8400-e29b-41d4-a716-446655440032',
        text: 'Which of the following are good password practices?',
        question_type: 'multiple_choice',
        complexity: 'medium',
        points: 2,
        explanation: 'Strong passwords should be long, complex, unique, and not shared.',
        question_order: 1
      }
    ];

    const { error: questionsError } = await supabaseClient
      .from('questions')
      .insert(questions);

    if (questionsError) throw questionsError;

    // Create question options
    const options = [
      // Question 1 options
      { id: '550e8400-e29b-41d4-a716-446655440050', question_id: '550e8400-e29b-41d4-a716-446655440040', text: 'To manage hardware and software resources', is_correct: true, option_order: 1 },
      { id: '550e8400-e29b-41d4-a716-446655440051', question_id: '550e8400-e29b-41d4-a716-446655440040', text: 'To create documents', is_correct: false, option_order: 2 },
      { id: '550e8400-e29b-41d4-a716-446655440052', question_id: '550e8400-e29b-41d4-a716-446655440040', text: 'To browse the internet', is_correct: false, option_order: 3 },
      { id: '550e8400-e29b-41d4-a716-446655440053', question_id: '550e8400-e29b-41d4-a716-446655440040', text: 'To play games', is_correct: false, option_order: 4 },
      
      // Question 2 options
      { id: '550e8400-e29b-41d4-a716-446655440054', question_id: '550e8400-e29b-41d4-a716-446655440041', text: 'Keyboard', is_correct: true, option_order: 1 },
      { id: '550e8400-e29b-41d4-a716-446655440055', question_id: '550e8400-e29b-41d4-a716-446655440041', text: 'Mouse', is_correct: true, option_order: 2 },
      { id: '550e8400-e29b-41d4-a716-446655440056', question_id: '550e8400-e29b-41d4-a716-446655440041', text: 'Monitor', is_correct: false, option_order: 3 },
      { id: '550e8400-e29b-41d4-a716-446655440057', question_id: '550e8400-e29b-41d4-a716-446655440041', text: 'Microphone', is_correct: true, option_order: 4 },
      
      // Question 3 options
      { id: '550e8400-e29b-41d4-a716-446655440058', question_id: '550e8400-e29b-41d4-a716-446655440042', text: 'Uniform Resource Locator', is_correct: true, option_order: 1 },
      { id: '550e8400-e29b-41d4-a716-446655440059', question_id: '550e8400-e29b-41d4-a716-446655440042', text: 'Universal Resource Link', is_correct: false, option_order: 2 },
      { id: '550e8400-e29b-41d4-a716-446655440060', question_id: '550e8400-e29b-41d4-a716-446655440042', text: 'Unified Resource Location', is_correct: false, option_order: 3 },
      { id: '550e8400-e29b-41d4-a716-446655440061', question_id: '550e8400-e29b-41d4-a716-446655440042', text: 'Universal Reference Locator', is_correct: false, option_order: 4 },
      
      // Question 4 options
      { id: '550e8400-e29b-41d4-a716-446655440062', question_id: '550e8400-e29b-41d4-a716-446655440043', text: 'Use at least 8 characters', is_correct: true, option_order: 1 },
      { id: '550e8400-e29b-41d4-a716-446655440063', question_id: '550e8400-e29b-41d4-a716-446655440043', text: 'Include uppercase and lowercase letters', is_correct: true, option_order: 2 },
      { id: '550e8400-e29b-41d4-a716-446655440064', question_id: '550e8400-e29b-41d4-a716-446655440043', text: 'Share passwords with colleagues', is_correct: false, option_order: 3 },
      { id: '550e8400-e29b-41d4-a716-446655440065', question_id: '550e8400-e29b-41d4-a716-446655440043', text: 'Use unique passwords for each account', is_correct: true, option_order: 4 }
    ];

    const { error: optionsError } = await supabaseClient
      .from('question_options')
      .insert(options);

    if (optionsError) throw optionsError;
    console.log('Questions and options created successfully');
  }

  static async createSystemSettings(supabaseClient: any) {
    console.log('Creating system settings...');
    
    const settings = [
      // Security Settings
      { category: 'security', setting_key: 'max_login_attempts', setting_value: '5', description: 'Maximum failed login attempts before account lockout', setting_type: 'number', is_editable: true },
      { category: 'security', setting_key: 'lockout_duration', setting_value: '30', description: 'Account lockout duration in minutes', setting_type: 'number', is_editable: true },
      { category: 'security', setting_key: 'session_timeout', setting_value: '120', description: 'User session timeout in minutes', setting_type: 'number', is_editable: true },
      { category: 'security', setting_key: 'password_min_length', setting_value: '8', description: 'Minimum password length requirement', setting_type: 'number', is_editable: true },
      { category: 'security', setting_key: 'password_complexity', setting_value: 'true', description: 'Require complex passwords (uppercase, lowercase, numbers)', setting_type: 'boolean', is_editable: true },
      { category: 'security', setting_key: 'force_password_change', setting_value: '90', description: 'Force password change every X days', setting_type: 'number', is_editable: true },
      
      // Test Settings
      { category: 'test', setting_key: 'auto_save_interval', setting_value: '30', description: 'Auto-save test progress every X seconds', setting_type: 'number', is_editable: true },
      { category: 'test', setting_key: 'enable_auto_save', setting_value: 'true', description: 'Enable automatic saving of test progress', setting_type: 'boolean', is_editable: true },
      { category: 'test', setting_key: 'auto_submit_on_timeout', setting_value: 'true', description: 'Automatically submit test when time expires', setting_type: 'boolean', is_editable: true },
      { category: 'test', setting_key: 'show_time_warning', setting_value: 'true', description: 'Show warning when 5 minutes remaining', setting_type: 'boolean', is_editable: true },
      { category: 'test', setting_key: 'allow_question_navigation', setting_value: 'true', description: 'Allow users to navigate between questions', setting_type: 'boolean', is_editable: true },
      { category: 'test', setting_key: 'enable_question_flagging', setting_value: 'true', description: 'Allow users to flag questions for review', setting_type: 'boolean', is_editable: true },
      { category: 'test', setting_key: 'network_pause_enabled', setting_value: 'true', description: 'Auto-pause test when network is unavailable', setting_type: 'boolean', is_editable: true },
      
      // General Settings
      { category: 'general', setting_key: 'site_name', setting_value: 'eSigma Survey Platform', description: 'Application name displayed to users', setting_type: 'string', is_editable: true },
      { category: 'general', setting_key: 'site_description', setting_value: 'Online MCQ Test Management System', description: 'Application description', setting_type: 'string', is_editable: true },
      { category: 'general', setting_key: 'support_email', setting_value: 'support@esigma.com', description: 'Support contact email address', setting_type: 'email', is_editable: true },
      { category: 'general', setting_key: 'maintenance_mode', setting_value: 'false', description: 'Enable maintenance mode to restrict access', setting_type: 'boolean', is_editable: true },
      { category: 'general', setting_key: 'default_timezone', setting_value: 'Asia/Kolkata', description: 'Default system timezone', setting_type: 'select', is_editable: true, options: ['Asia/Kolkata', 'UTC', 'America/New_York', 'Europe/London'] },
      { category: 'general', setting_key: 'date_format', setting_value: 'DD/MM/YYYY', description: 'Date display format', setting_type: 'select', is_editable: true, options: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] }
    ];

    const { error } = await supabaseClient
      .from('system_settings')
      .insert(settings);

    if (error) throw error;
    console.log('System settings created successfully');
  }

  static async checkDatabaseConnection() {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      return { success: true, message: 'Database connection successful' };
    } catch (error) {
      console.error('Database connection failed:', error);
      return { success: false, message: 'Database connection failed', error };
    }
  }
}
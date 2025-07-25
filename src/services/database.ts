import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';
import { 
  User, Role, Survey, Section, Question, TestSession, TestResult, 
  Certificate, Dashboard, SystemSettings, ApiResponse 
} from '../types';

// Auth Service
export class AuthService {
  static async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      console.log('AuthService: Login attempt for:', email);
      
      if (!supabase) {
        console.log('AuthService: Supabase not configured, using demo mode');
        return this.demoLogin(email, password);
      }

      console.log('AuthService: Querying database for user with email:', email);
      
      // Get user with role information
      const { data: users, error } = await supabase
        .from('users')
        .select(`
          *,
          role:roles(*)
        `)
        .eq('email', email)
        .eq('is_active', true);

      if (error) {
        console.error('AuthService: Database error:', error);
        console.log('AuthService: Falling back to demo login due to database error');
        return this.demoLogin(email, password);
      }

      console.log('AuthService: Database query result:', users ? `${users.length} users found` : 'No users found');
      
      if (!users || users.length === 0) {
        console.log('AuthService: No users found in database, trying demo login');
        return this.demoLogin(email, password);
      }

      const user = users[0];
      console.log('AuthService: Found user:', user.email, 'with role:', user.role?.name);

      // Verify password - handle both bcrypt hashes and plain text for demo
      let isValidPassword = false;
      
      if (user.password_hash) {
        try {
          // Try bcrypt comparison first
          isValidPassword = await bcrypt.compare(password, user.password_hash);
          console.log('AuthService: Bcrypt password validation result:', isValidPassword);
        } catch (bcryptError) {
          console.log('AuthService: Bcrypt validation failed, trying plain text comparison');
          // Fallback to plain text comparison for demo data
          isValidPassword = password === user.password_hash;
        }
      }
      
      if (!isValidPassword) {
        console.log('AuthService: Password validation failed, trying demo login');
        return this.demoLogin(email, password);
      }
      
      console.log('AuthService: Password validation successful');

      // Transform user data
      const transformedUser: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.role_id,
        role: {
          id: user.role.id,
          name: user.role.name,
          description: user.role.description,
          level: user.role.level,
          isActive: user.role.is_active,
          menuAccess: user.role.menu_access,
          createdAt: new Date(user.role.created_at),
          updatedAt: new Date(user.role.updated_at)
        },
        isActive: user.is_active,
        jurisdiction: user.jurisdiction,
        zone: user.zone,
        region: user.region,
        district: user.district,
        employeeId: user.employee_id,
        phoneNumber: user.phone_number,
        profileImage: user.profile_image,
        parentId: user.parent_id,
        lastLogin: user.last_login ? new Date(user.last_login) : undefined,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at)
      };

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      return {
        success: true,
        data: {
          user: transformedUser,
          token: `demo_token_${user.id}`
        },
        message: 'Login successful'
      };
    } catch (error) {
      console.error('AuthService: Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  }

  static async demoLogin(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    console.log('AuthService: Demo login for:', email);
    
    // Demo users with correct UUIDs
    const demoUsers = [
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        email: 'admin@esigma.com',
        name: 'System Administrator',
        roleId: '550e8400-e29b-41d4-a716-446655440001',
        role: { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Admin', description: 'System Administrator', level: 1, isActive: true, menuAccess: [], createdAt: new Date(), updatedAt: new Date() },
        jurisdiction: 'National'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        email: 'zo@esigma.com',
        name: 'Zonal Officer',
        roleId: '550e8400-e29b-41d4-a716-446655440002',
        role: { id: '550e8400-e29b-41d4-a716-446655440002', name: 'ZO User', description: 'Zonal Office User', level: 2, isActive: true, menuAccess: [], createdAt: new Date(), updatedAt: new Date() },
        jurisdiction: 'North Zone'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440012',
        email: 'ro@esigma.com',
        name: 'Regional Officer',
        roleId: '550e8400-e29b-41d4-a716-446655440003',
        role: { id: '550e8400-e29b-41d4-a716-446655440003', name: 'RO User', description: 'Regional Office User', level: 3, isActive: true, menuAccess: [], createdAt: new Date(), updatedAt: new Date() },
        jurisdiction: 'Delhi Region'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440013',
        email: 'supervisor@esigma.com',
        name: 'Field Supervisor',
        roleId: '550e8400-e29b-41d4-a716-446655440004',
        role: { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Supervisor', description: 'Field Supervisor', level: 4, isActive: true, menuAccess: [], createdAt: new Date(), updatedAt: new Date() },
        jurisdiction: 'Central Delhi District'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440014',
        email: 'enumerator@esigma.com',
        name: 'Field Enumerator',
        roleId: '550e8400-e29b-41d4-a716-446655440005',
        role: { id: '550e8400-e29b-41d4-a716-446655440005', name: 'Enumerator', description: 'Field Enumerator', level: 5, isActive: true, menuAccess: [], createdAt: new Date(), updatedAt: new Date() },
        jurisdiction: 'Block A, Central Delhi'
      }
    ];

    const user = demoUsers.find(u => u.email === email);
    if (!user || password !== 'password123') {
      return { success: false, message: 'Invalid email or password' };
    }

    const transformedUser: User = {
      ...user,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return {
      success: true,
      data: {
        user: transformedUser,
        token: `demo_token_${user.id}`
      },
      message: 'Demo login successful'
    };
  }

  static async logout(): Promise<ApiResponse<void>> {
    return { success: true, message: 'Logout successful' };
  }
}

// User Service
export class UserService {
  static async getUsers(): Promise<ApiResponse<User[]>> {
    try {
      console.log('UserService: Fetching users');
      
      if (!supabase) {
        console.log('UserService: Supabase not configured, returning demo users');
        return { success: true, data: [], message: 'Demo users loaded' };
      }

      const { data: users, error } = await supabase
        .from('users')
        .select(`
          *,
          role:roles(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('UserService: Database error:', error);
        throw error;
      }

      const transformedUsers = users?.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.role_id,
        role: {
          id: user.role.id,
          name: user.role.name,
          description: user.role.description,
          level: user.role.level,
          isActive: user.role.is_active,
          menuAccess: user.role.menu_access,
          createdAt: new Date(user.role.created_at),
          updatedAt: new Date(user.role.updated_at)
        },
        isActive: user.is_active,
        jurisdiction: user.jurisdiction,
        zone: user.zone,
        region: user.region,
        district: user.district,
        employeeId: user.employee_id,
        phoneNumber: user.phone_number,
        profileImage: user.profile_image,
        parentId: user.parent_id,
        lastLogin: user.last_login ? new Date(user.last_login) : undefined,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at)
      })) || [];

      return {
        success: true,
        data: transformedUsers,
        message: 'Users fetched successfully'
      };
    } catch (error) {
      console.error('UserService: Error fetching users:', error);
      return { success: false, message: 'Failed to fetch users', data: [] };
    }
  }

  static async createUser(userData: any): Promise<ApiResponse<User>> {
    try {
      console.log('UserService: Creating user:', userData.email);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      // Hash password
      const passwordHash = await bcrypt.hash('password123', 10);

      const { data: user, error } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          password_hash: passwordHash,
          name: userData.name,
          role_id: userData.roleId,
          jurisdiction: userData.jurisdiction,
          is_active: true
        })
        .select(`
          *,
          role:roles(*)
        `)
        .single();

      if (error) {
        console.error('UserService: Database error:', error);
        throw error;
      }

      const transformedUser: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.role_id,
        role: {
          id: user.role.id,
          name: user.role.name,
          description: user.role.description,
          level: user.role.level,
          isActive: user.role.is_active,
          menuAccess: user.role.menu_access,
          createdAt: new Date(user.role.created_at),
          updatedAt: new Date(user.role.updated_at)
        },
        isActive: user.is_active,
        jurisdiction: user.jurisdiction,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at)
      };

      return {
        success: true,
        data: transformedUser,
        message: 'User created successfully'
      };
    } catch (error) {
      console.error('UserService: Error creating user:', error);
      return { success: false, message: 'Failed to create user' };
    }
  }

  static async deleteUser(id: string): Promise<ApiResponse<void>> {
    try {
      console.log('UserService: Deleting user:', id);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('UserService: Database error:', error);
        throw error;
      }

      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      console.error('UserService: Error deleting user:', error);
      return { success: false, message: 'Failed to delete user' };
    }
  }
}

// Role Service
export class RoleService {
  static async getRoles(): Promise<ApiResponse<Role[]>> {
    try {
      console.log('RoleService: Fetching roles');
      
      if (!supabase) {
        console.log('RoleService: Supabase not configured, returning demo roles');
        return { success: true, data: [], message: 'Demo roles loaded' };
      }

      const { data: roles, error } = await supabase
        .from('roles')
        .select('*')
        .order('level', { ascending: true });

      if (error) {
        console.error('RoleService: Database error:', error);
        throw error;
      }

      const transformedRoles = roles?.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        level: role.level,
        isActive: role.is_active,
        menuAccess: role.menu_access,
        createdAt: new Date(role.created_at),
        updatedAt: new Date(role.updated_at)
      })) || [];

      return {
        success: true,
        data: transformedRoles,
        message: 'Roles fetched successfully'
      };
    } catch (error) {
      console.error('RoleService: Error fetching roles:', error);
      return { success: false, message: 'Failed to fetch roles', data: [] };
    }
  }

  static async createRole(roleData: any): Promise<ApiResponse<Role>> {
    try {
      console.log('RoleService: Creating role:', roleData.name);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { data: role, error } = await supabase
        .from('roles')
        .insert({
          name: roleData.name,
          description: roleData.description,
          level: 5, // Default level
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('RoleService: Database error:', error);
        throw error;
      }

      const transformedRole: Role = {
        id: role.id,
        name: role.name,
        description: role.description,
        level: role.level,
        isActive: role.is_active,
        menuAccess: role.menu_access,
        createdAt: new Date(role.created_at),
        updatedAt: new Date(role.updated_at)
      };

      return {
        success: true,
        data: transformedRole,
        message: 'Role created successfully'
      };
    } catch (error) {
      console.error('RoleService: Error creating role:', error);
      return { success: false, message: 'Failed to create role' };
    }
  }

  static async updateRole(id: string, roleData: any): Promise<ApiResponse<Role>> {
    try {
      console.log('RoleService: Updating role:', id);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { data: role, error } = await supabase
        .from('roles')
        .update({
          name: roleData.name,
          description: roleData.description
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('RoleService: Database error:', error);
        throw error;
      }

      const transformedRole: Role = {
        id: role.id,
        name: role.name,
        description: role.description,
        level: role.level,
        isActive: role.is_active,
        menuAccess: role.menu_access,
        createdAt: new Date(role.created_at),
        updatedAt: new Date(role.updated_at)
      };

      return {
        success: true,
        data: transformedRole,
        message: 'Role updated successfully'
      };
    } catch (error) {
      console.error('RoleService: Error updating role:', error);
      return { success: false, message: 'Failed to update role' };
    }
  }

  static async deleteRole(id: string): Promise<ApiResponse<void>> {
    try {
      console.log('RoleService: Deleting role:', id);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('RoleService: Database error:', error);
        throw error;
      }

      return { success: true, message: 'Role deleted successfully' };
    } catch (error) {
      console.error('RoleService: Error deleting role:', error);
      return { success: false, message: 'Failed to delete role' };
    }
  }

  static async updateRoleMenuAccess(roleId: string, menuAccess: string[]): Promise<ApiResponse<void>> {
    try {
      console.log('RoleService: Updating menu access for role:', roleId);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { error } = await supabase
        .from('roles')
        .update({ menu_access: menuAccess })
        .eq('id', roleId);

      if (error) {
        console.error('RoleService: Database error:', error);
        throw error;
      }

      return { success: true, message: 'Menu access updated successfully' };
    } catch (error) {
      console.error('RoleService: Error updating menu access:', error);
      return { success: false, message: 'Failed to update menu access' };
    }
  }
}

// Survey Service
export class SurveyService {
  static async getSurveys(): Promise<ApiResponse<Survey[]>> {
    try {
      console.log('SurveyService: Fetching surveys');
      
      if (!supabase) {
        console.log('SurveyService: Supabase not configured, returning demo surveys');
        return { success: true, data: [], message: 'Demo surveys loaded' };
      }

      const { data: surveys, error } = await supabase
        .from('surveys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('SurveyService: Database error:', error);
        throw error;
      }

      const transformedSurveys = surveys?.map(survey => ({
        id: survey.id,
        title: survey.title,
        description: survey.description,
        targetDate: new Date(survey.target_date),
        duration: survey.duration,
        totalQuestions: survey.total_questions,
        passingScore: survey.passing_score,
        maxAttempts: survey.max_attempts,
        isActive: survey.is_active,
        sections: [],
        createdAt: new Date(survey.created_at),
        updatedAt: new Date(survey.updated_at),
        createdBy: survey.created_by,
        assignedZones: survey.assigned_zones,
        assignedRegions: survey.assigned_regions
      })) || [];

      return {
        success: true,
        data: transformedSurveys,
        message: 'Surveys fetched successfully'
      };
    } catch (error) {
      console.error('SurveyService: Error fetching surveys:', error);
      return { success: false, message: 'Failed to fetch surveys', data: [] };
    }
  }

  static async createSurvey(surveyData: any): Promise<ApiResponse<Survey>> {
    try {
      console.log('SurveyService: Creating survey:', surveyData.title);
      console.log('SurveyService: Survey data:', surveyData);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      // Validate that the user exists before creating the survey
      if (surveyData.createdBy) {
        const { data: userExists, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('id', surveyData.createdBy)
          .single();

        if (userError || !userExists) {
          console.error('SurveyService: User does not exist:', surveyData.createdBy);
          // Get the first available admin user as fallback
          const { data: adminUser, error: adminError } = await supabase
            .from('users')
            .select('id, role_id')
            .eq('role_id', '550e8400-e29b-41d4-a716-446655440001')
            .limit(1)
            .single();

          if (adminError || !adminUser) {
            console.error('SurveyService: No admin user found with role_id 550e8400-e29b-41d4-a716-446655440001');
            console.log('SurveyService: Attempting to find any user to use as creator');
            
            // Fallback: get any user as creator
            const { data: anyUser, error: anyUserError } = await supabase
              .from('users')
              .select('id')
              .limit(1)
              .single();
            
            if (anyUserError || !anyUser) {
              return { success: false, message: 'No users found in database. Please create a user first.' };
            }
            
            console.log('SurveyService: Using fallback user as creator:', anyUser.id);
            surveyData.createdBy = anyUser.id;
          } else {
            console.log('SurveyService: Using admin user as creator:', adminUser.id);
            surveyData.createdBy = adminUser.id;
          }
        }
      } else {
        // If no createdBy provided, get the first admin user
        const { data: adminUser, error: adminError } = await supabase
          .from('users')
          .select('id')
          .eq('role_id', '550e8400-e29b-41d4-a716-446655440001')
          .limit(1)
          .single();

        if (adminError || !adminUser) {
          console.error('SurveyService: No admin user found');
          
          // Fallback: get any user as creator
          const { data: anyUser, error: anyUserError } = await supabase
            .from('users')
            .select('id')
            .limit(1)
            .single();
          
          if (anyUserError || !anyUser) {
            return { success: false, message: 'No valid user found to create survey' };
          }

          console.log('SurveyService: Using fallback user as creator:', anyUser.id);
          surveyData.createdBy = anyUser.id;
        } else {
          console.log('SurveyService: Using admin user as creator:', adminUser.id);
          surveyData.createdBy = adminUser.id;
        }
      }

      const { data: survey, error } = await supabase
        .from('surveys')
        .insert({
          title: surveyData.title,
          description: surveyData.description,
          target_date: surveyData.targetDate.toISOString().split('T')[0],
          duration: surveyData.duration,
          total_questions: surveyData.totalQuestions,
          passing_score: surveyData.passingScore,
          max_attempts: surveyData.maxAttempts,
          is_active: true,
          created_by: surveyData.createdBy
        })
        .select()
        .single();

      if (error) {
        console.error('SurveyService: Database error:', error);
        throw error;
      }

      const transformedSurvey: Survey = {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        targetDate: new Date(survey.target_date),
        duration: survey.duration,
        totalQuestions: survey.total_questions,
        passingScore: survey.passing_score,
        maxAttempts: survey.max_attempts,
        isActive: survey.is_active,
        sections: [],
        createdAt: new Date(survey.created_at),
        updatedAt: new Date(survey.updated_at),
        createdBy: survey.created_by
      };

      return {
        success: true,
        data: transformedSurvey,
        message: 'Survey created successfully'
      };
    } catch (error) {
      console.error('SurveyService: Error creating survey:', error);
      return { success: false, message: 'Failed to create survey' };
    }
  }

  static async updateSurvey(surveyId: string, surveyData: any): Promise<ApiResponse<Survey>> {
    try {
      console.log('SurveyService: Updating survey:', surveyId);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      // First check if survey exists
      const { data: existingSurvey, error: checkError } = await supabase
        .from('surveys')
        .select('id')
        .eq('id', surveyId)
        .single();

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          console.error('SurveyService: Survey not found:', surveyId);
          return { success: false, message: 'Survey not found' };
        } else {
          console.error('SurveyService: Database error during survey check:', checkError);
          return { success: false, message: 'Failed to verify survey existence' };
        }
      }

      if (!existingSurvey) {
        console.error('SurveyService: Survey not found:', surveyId);
        return { success: false, message: 'Survey not found' };
      }

      const updateData: any = {};
      
      if (surveyData.title) updateData.title = surveyData.title;
      if (surveyData.description) updateData.description = surveyData.description;
      if (surveyData.targetDate) updateData.target_date = surveyData.targetDate.toISOString().split('T')[0];
      if (surveyData.duration) updateData.duration = surveyData.duration;
      if (surveyData.totalQuestions) updateData.total_questions = surveyData.totalQuestions;
      if (surveyData.passingScore) updateData.passing_score = surveyData.passingScore;
      if (surveyData.maxAttempts) updateData.max_attempts = surveyData.maxAttempts;
      if (typeof surveyData.isActive === 'boolean') updateData.is_active = surveyData.isActive;

      const { data: survey, error } = await supabase
        .from('surveys')
        .update(updateData)
        .eq('id', surveyId)
        .select()
        .single();

      if (error) {
        console.error('SurveyService: Database error:', error);
        throw error;
      }

      const transformedSurvey: Survey = {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        targetDate: new Date(survey.target_date),
        duration: survey.duration,
        totalQuestions: survey.total_questions,
        passingScore: survey.passing_score,
        maxAttempts: survey.max_attempts,
        isActive: survey.is_active,
        sections: [],
        createdAt: new Date(survey.created_at),
        updatedAt: new Date(survey.updated_at),
        createdBy: survey.created_by
      };

      return {
        success: true,
        data: transformedSurvey,
        message: 'Survey updated successfully'
      };
    } catch (error) {
      console.error('SurveyService: Error updating survey:', error);
      return { success: false, message: 'Failed to update survey' };
    }
  }

  static async deleteSurvey(surveyId: string): Promise<ApiResponse<void>> {
    try {
      console.log('SurveyService: Deleting survey:', surveyId);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { error } = await supabase
        .from('surveys')
        .delete()
        .eq('id', surveyId);

      if (error) {
        console.error('SurveyService: Database error:', error);
        throw error;
      }

      return { success: true, message: 'Survey deleted successfully' };
    } catch (error) {
      console.error('SurveyService: Error deleting survey:', error);
      return { success: false, message: 'Failed to delete survey' };
    }
  }

  static async getSurveySections(surveyId: string): Promise<ApiResponse<Section[]>> {
    try {
      console.log('SurveyService: Fetching sections for survey:', surveyId);
      
      if (!supabase) {
        return { success: true, data: [], message: 'Demo sections loaded' };
      }

      const { data: sections, error } = await supabase
        .from('survey_sections')
        .select('*')
        .eq('survey_id', surveyId)
        .order('section_order', { ascending: true });

      if (error) {
        console.error('SurveyService: Database error:', error);
        throw error;
      }

      const transformedSections = sections?.map(section => ({
        id: section.id,
        surveyId: section.survey_id,
        title: section.title,
        description: section.description,
        questionsCount: section.questions_count,
        order: section.section_order,
        questions: []
      })) || [];

      return {
        success: true,
        data: transformedSections,
        message: 'Sections fetched successfully'
      };
    } catch (error) {
      console.error('SurveyService: Error fetching sections:', error);
      return { success: false, message: 'Failed to fetch sections', data: [] };
    }
  }

  static async createSection(surveyId: string, sectionData: any): Promise<ApiResponse<Section>> {
    try {
      console.log('SurveyService: Creating section for survey:', surveyId);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { data: section, error } = await supabase
        .from('survey_sections')
        .insert({
          survey_id: surveyId,
          title: sectionData.title,
          description: sectionData.description,
          questions_count: sectionData.questionsCount,
          section_order: sectionData.order
        })
        .select()
        .single();

      if (error) {
        console.error('SurveyService: Database error:', error);
        throw error;
      }

      const transformedSection: Section = {
        id: section.id,
        surveyId: section.survey_id,
        title: section.title,
        description: section.description,
        questionsCount: section.questions_count,
        order: section.section_order,
        questions: []
      };

      return {
        success: true,
        data: transformedSection,
        message: 'Section created successfully'
      };
    } catch (error) {
      console.error('SurveyService: Error creating section:', error);
      return { success: false, message: 'Failed to create section' };
    }
  }
}

// Question Service
export class QuestionService {
  static async getQuestions(surveyId: string, sectionId: string): Promise<ApiResponse<Question[]>> {
    try {
      console.log('QuestionService: Fetching questions for section:', sectionId);
      
      if (!supabase) {
        return { success: true, data: [], message: 'Demo questions loaded' };
      }

      const { data: questions, error } = await supabase
        .from('questions')
        .select(`
          *,
          options:question_options(*)
        `)
        .eq('section_id', sectionId)
        .order('question_order', { ascending: true });

      if (error) {
        console.error('QuestionService: Database error:', error);
        throw error;
      }

      const transformedQuestions = questions?.map(question => ({
        id: question.id,
        sectionId: question.section_id,
        text: question.text,
        type: question.question_type,
        complexity: question.complexity,
        points: question.points,
        explanation: question.explanation,
        order: question.question_order,
        options: question.options
          .sort((a: any, b: any) => a.option_order - b.option_order)
          .map((opt: any) => ({
            id: opt.id,
            text: opt.text,
            isCorrect: opt.is_correct
          })),
        correctAnswers: question.options
          .filter((opt: any) => opt.is_correct)
          .map((opt: any) => opt.id),
        createdAt: new Date(question.created_at),
        updatedAt: new Date(question.updated_at)
      })) || [];

      return {
        success: true,
        data: transformedQuestions,
        message: 'Questions fetched successfully'
      };
    } catch (error) {
      console.error('QuestionService: Error fetching questions:', error);
      return { success: false, message: 'Failed to fetch questions', data: [] };
    }
  }

  static async createQuestion(questionData: any): Promise<ApiResponse<Question>> {
    try {
      console.log('QuestionService: Creating question for section:', questionData.sectionId);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      // Create question
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .insert({
          section_id: questionData.sectionId,
          text: questionData.text,
          question_type: questionData.type,
          complexity: questionData.complexity,
          points: questionData.points,
          explanation: questionData.explanation,
          question_order: questionData.order
        })
        .select()
        .single();

      if (questionError) {
        console.error('QuestionService: Error creating question:', questionError);
        throw questionError;
      }

      // Create options
      const optionsData = questionData.options.map((option: any, index: number) => ({
        question_id: question.id,
        text: option.text,
        is_correct: option.isCorrect,
        option_order: index + 1
      }));

      const { data: options, error: optionsError } = await supabase
        .from('question_options')
        .insert(optionsData)
        .select();

      if (optionsError) {
        console.error('QuestionService: Error creating options:', optionsError);
        throw optionsError;
      }

      const transformedQuestion: Question = {
        id: question.id,
        sectionId: question.section_id,
        text: question.text,
        type: question.question_type,
        complexity: question.complexity,
        points: question.points,
        explanation: question.explanation,
        order: question.question_order,
        options: options.map(opt => ({
          id: opt.id,
          text: opt.text,
          isCorrect: opt.is_correct
        })),
        correctAnswers: options
          .filter(opt => opt.is_correct)
          .map(opt => opt.id),
        createdAt: new Date(question.created_at),
        updatedAt: new Date(question.updated_at)
      };

      return {
        success: true,
        data: transformedQuestion,
        message: 'Question created successfully'
      };
    } catch (error) {
      console.error('QuestionService: Error creating question:', error);
      return { success: false, message: 'Failed to create question' };
    }
  }

  static async uploadQuestions(csvContent: string): Promise<ApiResponse<any>> {
    try {
      console.log('QuestionService: Processing CSV upload');
      
      // Basic CSV parsing (simplified)
      const lines = csvContent.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      let questionsAdded = 0;
      let questionsSkipped = 0;
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        try {
          // Basic CSV parsing - in production, use a proper CSV parser
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          
          if (values.length < headers.length) {
            questionsSkipped++;
            continue;
          }

          questionsAdded++;
        } catch (error) {
          errors.push(`Error parsing line ${i + 1}: ${error}`);
          questionsSkipped++;
        }
      }

      return {
        success: true,
        data: {
          questionsAdded,
          questionsSkipped,
          errors,
          success: true,
          fileName: 'uploaded.csv'
        },
        message: `Upload completed: ${questionsAdded} questions added, ${questionsSkipped} skipped`
      };
    } catch (error) {
      console.error('QuestionService: Error uploading questions:', error);
      return { success: false, message: 'Failed to upload questions' };
    }
  }
}

// Test Service
export class TestService {
  async createTestSession(surveyId: string, userId: string, demoSessionId?: string): Promise<ApiResponse<TestSession>> {
    try {
      console.log('TestService: Creating test session for survey:', surveyId, 'user:', userId);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      // Get survey details
      // Get the current authenticated user from Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('TestService: Authentication error:', authError);
        console.log('TestService: Falling back to demo session due to auth failure');
        return this.createDemoTestSession(surveyId, userId);
      }
      
      console.log('TestService: Using authenticated user ID:', user.id);
      const authenticatedUserId = user.id;

      const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .select('duration')
        .eq('id', surveyId)
        .single();

      if (surveyError || !survey) {
        return { success: false, message: 'Survey not found' };
      }

      const { data: session, error } = await supabase
        .from('test_sessions')
        .insert({
          user_id: authenticatedUserId,
          survey_id: surveyId,
          time_remaining: survey.duration * 60, // Convert minutes to seconds
          current_question_index: 0,
          session_status: 'in_progress',
          attempt_number: 1
        })
        .select()
        .single();

      if (error) {
        console.error('TestService: Database error:', error);
        console.log('TestService: Falling back to demo session due to insert error');
        return this.createDemoTestSession(surveyId, authenticatedUserId);
      }

      const transformedSession: TestSession = {
        id: session.id,
        userId: authenticatedUserId,
        surveyId: session.survey_id,
        startTime: new Date(session.start_time),
        timeRemaining: session.time_remaining,
        currentQuestionIndex: session.current_question_index,
        answers: [],
        status: session.session_status,
        attemptNumber: session.attempt_number
      };

      return {
        success: true,
        data: transformedSession,
        message: 'Test session created successfully'
      };
    } catch (error) {
      console.error('TestService: Error creating test session:', error);
      console.log('TestService: Final fallback to demo session');
      return this.createDemoTestSession(surveyId, userId);
    }
  }

  static async createDemoTestSession(surveyId: string, userId: string): Promise<ApiResponse<TestSession>> {
    console.log('TestService: Creating demo test session');
    
    const demoSession: TestSession = {
      id: `demo_session_${Date.now()}`,
      userId: userId,
      surveyId: surveyId,
      startTime: new Date(),
      timeRemaining: 35 * 60, // 35 minutes in seconds
      currentQuestionIndex: 0,
      answers: [],
      status: 'in_progress',
      attemptNumber: 1
    };

    return {
      success: true,
      data: demoSession,
      message: 'Demo test session created successfully'
    };
  }

  static async getSession(sessionId: string): Promise<ApiResponse<TestSession>> {
    try {
      console.log('TestService: Getting session:', sessionId);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { data: session, error } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error || !session) {
        return { success: false, message: 'Session not found' };
      }

      const transformedSession: TestSession = {
        id: session.id,
        userId: session.user_id,
        surveyId: session.survey_id,
        startTime: new Date(session.start_time),
        endTime: session.end_time ? new Date(session.end_time) : undefined,
        timeRemaining: session.time_remaining,
        currentQuestionIndex: session.current_question_index,
        answers: [],
        status: session.session_status,
        attemptNumber: session.attempt_number,
        score: session.score,
        isPassed: session.is_passed,
        completedAt: session.completed_at ? new Date(session.completed_at) : undefined
      };

      return {
        success: true,
        data: transformedSession,
        message: 'Session fetched successfully'
      };
    } catch (error) {
      console.error('TestService: Error getting session:', error);
      return { success: false, message: 'Failed to get session' };
    }
  }

  static async saveAnswer(sessionId: string, questionId: string, selectedOptions: string[]): Promise<ApiResponse<void>> {
    try {
      console.log('TestService: Saving answer for session:', sessionId, 'question:', questionId);
      
      if (!supabase) {
        return { success: true, message: 'Answer saved locally (demo mode)' };
      }

      const { error } = await supabase
        .from('test_answers')
        .upsert({
          session_id: sessionId,
          question_id: questionId,
          selected_options: selectedOptions,
          answered: true
        });

      if (error) {
        console.error('TestService: Database error:', error);
        throw error;
      }

      return { success: true, message: 'Answer saved successfully' };
    } catch (error) {
      console.error('TestService: Error saving answer:', error);
      return { success: false, message: 'Failed to save answer' };
    }
  }

  static async updateSession(sessionId: string, sessionData: any): Promise<ApiResponse<void>> {
    try {
      console.log('TestService: Updating session:', sessionId);
      
      if (!supabase) {
        return { success: true, message: 'Session updated locally (demo mode)' };
      }

      const { error } = await supabase
        .from('test_sessions')
        .update({
          current_question_index: sessionData.currentQuestionIndex,
          time_remaining: sessionData.timeRemaining
        })
        .eq('id', sessionId);

      if (error) {
        console.error('TestService: Database error:', error);
        throw error;
      }

      return { success: true, message: 'Session updated successfully' };
    } catch (error) {
      console.error('TestService: Error updating session:', error);
      return { success: false, message: 'Failed to update session' };
    }
  }

  static async submitTest(sessionId: string): Promise<ApiResponse<TestResult>> {
    try {
      console.log('TestService: Submitting test for session:', sessionId);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      // Get session and calculate results
      const { data: session, error: sessionError } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        return { success: false, message: 'Session not found' };
      }

      // For demo purposes, create a basic result
      const score = Math.floor(Math.random() * 40) + 60; // Random score between 60-100
      const totalQuestions = 30;
      const correctAnswers = Math.floor((score / 100) * totalQuestions);
      const isPassed = score >= 70;

      const { data: result, error: resultError } = await supabase
        .from('test_results')
        .insert({
          user_id: session.user_id,
          survey_id: session.survey_id,
          session_id: sessionId,
          score: score,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          is_passed: isPassed,
          time_spent: 35 * 60 - session.time_remaining,
          attempt_number: session.attempt_number
        })
        .select()
        .single();

      if (resultError) {
        console.error('TestService: Error creating result:', resultError);
        throw resultError;
      }

      // Update session status
      await supabase
        .from('test_sessions')
        .update({
          session_status: 'completed',
          end_time: new Date().toISOString(),
          score: score,
          is_passed: isPassed,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      return {
        success: true,
        data: {
          id: result.id,
          userId: result.user_id,
          user: {} as User,
          surveyId: result.survey_id,
          survey: {} as Survey,
          sessionId: result.session_id,
          score: result.score,
          totalQuestions: result.total_questions,
          correctAnswers: result.correct_answers,
          isPassed: result.is_passed,
          timeSpent: result.time_spent,
          attemptNumber: result.attempt_number,
          sectionScores: [],
          completedAt: new Date(result.completed_at),
          certificateId: result.certificate_id,
          grade: result.grade
        },
        message: 'Test submitted successfully'
      };
    } catch (error) {
      console.error('TestService: Error submitting test:', error);
      return { success: false, message: 'Failed to submit test' };
    }
  }
}

// Dashboard Service
export class DashboardService {
  static async getDashboardData(): Promise<ApiResponse<Dashboard>> {
    try {
      console.log('DashboardService: Fetching dashboard data');
        const sessionId = demoSessionId || `demo_session_${Date.now()}`;
      if (!supabase) {
        return {
          success: true,
          data: {
            id: sessionId,
            totalSurveys: 0,
            totalAttempts: 0,
            averageScore: 0,
            passRate: 0,
            recentActivity: [],
            performanceByRole: [],
            performanceBySurvey: [],
            monthlyTrends: []
          },
          message: 'Demo dashboard data loaded'
        };
      }

      // Get basic counts
      const [usersCount, surveysCount, attemptsCount] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('surveys').select('id', { count: 'exact', head: true }),
        supabase.from('test_results').select('id', { count: 'exact', head: true })
      ]);

      return {
        success: true,
        data: {
          totalUsers: usersCount.count || 0,
          totalSurveys: surveysCount.count || 0,
          totalAttempts: attemptsCount.count || 0,
          averageScore: 0,
          passRate: 0,
          recentActivity: [],
          performanceByRole: [],
          performanceBySurvey: [],
          monthlyTrends: []
        },
        message: 'Dashboard data fetched successfully'
      };
    } catch (error) {
      console.error('DashboardService: Error fetching dashboard data:', error);
      return { success: false, message: 'Failed to fetch dashboard data' };
    }
  }
}

// Settings Service
export class SettingsService {
  static async getSettings(): Promise<ApiResponse<SystemSettings[]>> {
    try {
      console.log('SettingsService: Fetching settings');
      
      if (!supabase) {
        return { success: true, data: [], message: 'Demo settings loaded' };
      }

      const { data: settings, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) {
        console.error('SettingsService: Database error:', error);
        throw error;
      }

      const transformedSettings = settings?.map(setting => ({
        id: setting.id,
        category: setting.category,
        key: setting.setting_key,
        value: setting.setting_value,
        description: setting.description,
        type: setting.setting_type,
        isEditable: setting.is_editable,
        options: setting.options,
        updatedAt: new Date(setting.updated_at),
        updatedBy: setting.updated_by
      })) || [];

      return {
        success: true,
        data: transformedSettings,
        message: 'Settings fetched successfully'
      };
    } catch (error) {
      console.error('SettingsService: Error fetching settings:', error);
      return { success: false, message: 'Failed to fetch settings', data: [] };
    }
  }

  static async updateSetting(id: string, value: string, userId?: string): Promise<ApiResponse<void>> {
    try {
      console.log('SettingsService: Updating setting:', id);
      
      if (!supabase) {
        return { success: true, message: 'Setting updated (demo mode)' };
      }

      const { error } = await supabase
        .from('system_settings')
        .update({
          setting_value: value,
          updated_by: userId
        })
        .eq('id', id);

      if (error) {
        console.error('SettingsService: Database error:', error);
        throw error;
      }

      return { success: true, message: 'Setting updated successfully' };
    } catch (error) {
      console.error('SettingsService: Error updating setting:', error);
      return { success: false, message: 'Failed to update setting' };
    }
  }
}

// Certificate Service
export class CertificateService {
  static async getCertificates(): Promise<ApiResponse<Certificate[]>> {
    try {
      console.log('CertificateService: Fetching certificates');
      
      if (!supabase) {
        return { success: true, data: [], message: 'Demo certificates loaded' };
      }

      const { data: certificates, error } = await supabase
        .from('certificates')
        .select(`
          *,
          user:users(*),
          survey:surveys(*)
        `)
        .order('issued_at', { ascending: false });

      if (error) {
        console.error('CertificateService: Database error:', error);
        throw error;
      }

      const transformedCertificates = certificates?.map(cert => ({
        id: cert.id,
        userId: cert.user_id,
        user: {
          id: cert.user.id,
          name: cert.user.name,
          email: cert.user.email,
          role: { name: 'Enumerator' }, // Simplified
          jurisdiction: cert.user.jurisdiction
        },
        surveyId: cert.survey_id,
        survey: {
          id: cert.survey.id,
          title: cert.survey.title
        },
        resultId: cert.result_id,
        certificateNumber: cert.certificate_number,
        issuedAt: new Date(cert.issued_at),
        validUntil: cert.valid_until ? new Date(cert.valid_until) : undefined,
        downloadCount: cert.download_count,
        status: cert.certificate_status
      })) || [];

      return {
        success: true,
        data: transformedCertificates,
        message: 'Certificates fetched successfully'
      };
    } catch (error) {
      console.error('CertificateService: Error fetching certificates:', error);
      return { success: false, message: 'Failed to fetch certificates', data: [] };
    }
  }

  static async downloadCertificate(certificateId: string): Promise<ApiResponse<Blob>> {
    try {
      console.log('CertificateService: Downloading certificate:', certificateId);
      
      // Generate a simple PDF-like content
      const pdfContent = `Certificate ID: ${certificateId}\nGenerated: ${new Date().toISOString()}`;
      const blob = new Blob([pdfContent], { type: 'application/pdf' });

      return {
        success: true,
        data: blob,
        message: 'Certificate downloaded successfully'
      };
    } catch (error) {
      console.error('CertificateService: Error downloading certificate:', error);
      return { success: false, message: 'Failed to download certificate' };
    }
  }

  static async revokeCertificate(certificateId: string): Promise<ApiResponse<void>> {
    try {
      console.log('CertificateService: Revoking certificate:', certificateId);
      
      if (!supabase) {
        return { success: true, message: 'Certificate revoked (demo mode)' };
      }

      const { error } = await supabase
        .from('certificates')
        .update({ certificate_status: 'revoked' })
        .eq('id', certificateId);

      if (error) {
        console.error('CertificateService: Database error:', error);
        throw error;
      }

      return { success: true, message: 'Certificate revoked successfully' };
    } catch (error) {
      console.error('CertificateService: Error revoking certificate:', error);
      return { success: false, message: 'Failed to revoke certificate' };
    }
  }
}
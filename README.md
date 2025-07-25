# eSigma Survey Platform

A comprehensive online MCQ test management system built with React, TypeScript, and Supabase.

## Features

- **Role-Based Access Control (RBAC)** - 5 hierarchical user roles with specific permissions
- **Survey Management** - Create and manage surveys with multiple sections
- **Question Bank** - Comprehensive question management with different types and complexity levels
- **Test Interface** - Real-time test taking with auto-save and network resilience
- **Results & Analytics** - Detailed performance tracking and reporting
- **Certificate Generation** - Automatic certificate creation for passed tests
- **System Settings** - Configurable security, test, and general settings

## User Roles

1. **Admin** (Level 1) - Full system access
2. **ZO User** (Level 2) - Zonal office management
3. **RO User** (Level 3) - Regional office management
4. **Supervisor** (Level 4) - Team management
5. **Enumerator** (Level 5) - Test taking

## Demo Credentials

The application includes demo accounts for testing:

- **Admin**: admin@esigma.com / password123
- **ZO User**: zo@esigma.com / password123
- **RO User**: ro@esigma.com / password123
- **Supervisor**: supervisor@esigma.com / password123
- **Enumerator**: enumerator@esigma.com / password123

## Setup Instructions

### Production Setup with Supabase

1. **Create Supabase Project**
   - Go to [https://supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL, anon key, and service role key

2. **Configure Environment Variables**
   ```bash
   # Copy .env.example to .env and update with your Supabase credentials
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

3. **Initialize Database**
   ```bash
   # Start the application
   npm run dev
   
   # On the login page, click "Initialize Database"
   # This will create all tables and sample data automatically
   ```

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

### Important Notes

- **Database Required**: This application requires a properly configured Supabase database
- **Environment Variables**: All Supabase environment variables must be set correctly
- **Database Initialization**: Run the database initialization on first setup
- **Production Ready**: This version is designed for production use with persistent data storage

## Database Schema

### Core Tables
- `roles` - User roles and permissions
- `users` - User accounts with authentication
- `surveys` - Survey definitions
- `survey_sections` - Survey sections
- `questions` - Question bank
- `question_options` - Answer options
- `test_sessions` - Active test sessions
- `test_answers` - User responses
- `test_results` - Final results
- `section_scores` - Section-wise performance
- `certificates` - Generated certificates
- `system_settings` - Configuration
- `activity_logs` - Audit trail

### Security Features
- Row Level Security (RLS) on all tables
- Role-based access policies
- Password hashing with bcrypt
- Account lockout after failed attempts
- Session timeout management

## Key Features

### Authentication & Security
- Secure login with password hashing
- Account lockout after failed attempts
- Session timeout management
- Role-based access control
- Menu access control per role

### Test Management
- Real-time test interface
- Auto-save functionality
- Network resilience (auto-pause/resume)
- Question navigation and flagging
- Time warnings and auto-submit
- Offline capability with sync

### Analytics & Reporting
- Performance dashboards by role
- Zone/Region/District analytics
- Individual and team performance
- Certificate tracking
- Activity logging

### System Administration
- User management
- Role and permission management
- Survey and question management
- System settings configuration
- Certificate management

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with custom logic
- **Charts**: Recharts
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Build Tool**: Vite

## Deployment

The application is deployed on Netlify and can be accessed at:
https://dynamic-florentine-948ce9.netlify.app

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@esigma.com or create an issue in the repository.
# eSigma Survey Platform - Database Documentation

## Overview
This document provides comprehensive information about the MySQL database schema for the eSigma Survey Platform, an online MCQ test management system.

## Database Structure

### Core Tables

#### 1. Users & Authentication
- **users**: Main user table with hierarchical structure
- **roles**: Role-based access control
- **permissions**: Granular permission system
- **role_permissions**: Many-to-many mapping between roles and permissions

#### 2. Survey Management
- **surveys**: Survey/test definitions
- **survey_sections**: Sections within surveys
- **questions**: Individual questions
- **question_options**: Multiple choice options
- **survey_assignments**: Assignment of surveys to users/groups

#### 3. Test Execution
- **test_sessions**: Active test sessions
- **test_answers**: User responses to questions
- **test_results**: Final test results
- **section_scores**: Section-wise performance

#### 4. Certificates
- **certificates**: Generated certificates for passed tests

#### 5. System Management
- **system_settings**: Configurable system parameters
- **activity_logs**: Audit trail
- **notifications**: User notifications
- **capi_sync_status**: CAPI application integration

## Key Features

### 1. Hierarchical User Structure
```
Admin → ZO User → RO User → Supervisor → Enumerator
```

### 2. Role-Based Access Control
- 5 predefined roles with specific permission sets
- Granular permissions for different modules
- Flexible assignment system

### 3. Test Management
- Multi-section surveys
- Question complexity levels (easy, medium, hard)
- Multiple choice and single choice questions
- Automatic scoring and result calculation

### 4. Certificate Generation
- Automatic certificate generation for passed tests
- Unique certificate numbers
- Download tracking
- Revocation capability

### 5. Performance Optimization
- Comprehensive indexing strategy
- Optimized views for reporting
- Stored procedures for complex operations
- Triggers for automatic data maintenance

## Installation Instructions

### 1. Prerequisites
- MySQL 8.0 or higher
- Sufficient disk space (minimum 1GB recommended)
- MySQL user with CREATE DATABASE privileges

### 2. Database Setup
```sql
-- Run the schema.sql file
mysql -u root -p < schema.sql
```

### 3. Configuration
Update your application configuration with:
```
DB_HOST=localhost
DB_DATABASE=esigma_survey_platform
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

### 4. Default Credentials
- **Admin User**: admin@esigma.com / password123
- **ZO User**: zo@esigma.com / password123
- **RO User**: ro@esigma.com / password123
- **Supervisor**: supervisor@esigma.com / password123
- **Enumerator**: enumerator@esigma.com / password123

## API Integration Points

### 1. CAPI Integration
The `capi_sync_status` table manages synchronization with the offline CAPI application:
- Tracks sync status for each user-survey combination
- Stores sync data and error messages
- Enables offline-online data synchronization

### 2. Test Session Management
Real-time test session tracking:
- Session state persistence
- Network interruption recovery
- Time tracking and auto-submission

### 3. Result Analytics
Comprehensive reporting capabilities:
- User performance tracking
- Survey statistics
- Hierarchical reporting (Zone → Region → District)

## Security Features

### 1. Data Protection
- Password hashing (bcrypt)
- SQL injection prevention through parameterized queries
- Role-based data access restrictions

### 2. Audit Trail
- Complete activity logging
- User action tracking
- System change monitoring

### 3. Session Management
- Configurable session timeouts
- IP address and user agent tracking
- Concurrent session handling

## Maintenance Procedures

### 1. Regular Maintenance
```sql
-- Optimize tables monthly
OPTIMIZE TABLE users, test_results, activity_logs;

-- Update table statistics
ANALYZE TABLE users, surveys, test_results;

-- Clean old activity logs (older than 1 year)
DELETE FROM activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

### 2. Backup Strategy
```bash
# Daily backup
mysqldump -u username -p esigma_survey_platform > backup_$(date +%Y%m%d).sql

# Weekly full backup with compression
mysqldump -u username -p esigma_survey_platform | gzip > backup_$(date +%Y%m%d).sql.gz
```

### 3. Performance Monitoring
```sql
-- Check slow queries
SELECT * FROM mysql.slow_log WHERE start_time > DATE_SUB(NOW(), INTERVAL 1 DAY);

-- Monitor table sizes
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'esigma_survey_platform'
ORDER BY (data_length + index_length) DESC;
```

## Troubleshooting

### Common Issues

1. **Connection Issues**
   - Verify MySQL service is running
   - Check firewall settings
   - Validate connection credentials

2. **Performance Issues**
   - Review slow query log
   - Check index usage with EXPLAIN
   - Monitor memory usage

3. **Data Integrity Issues**
   - Run CHECK TABLE on affected tables
   - Verify foreign key constraints
   - Check for orphaned records

### Support Contacts
For technical support, contact the development team with:
- Error messages
- Database version
- Query execution plans (if applicable)
- System configuration details

## Version History
- v1.0: Initial database schema
- v1.1: Added CAPI integration tables
- v1.2: Enhanced indexing and performance optimization
- v1.3: Added comprehensive audit logging
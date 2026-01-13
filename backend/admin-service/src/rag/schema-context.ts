/**
 * Comprehensive Database Schema for Advanced RAG
 * Auto-generated based on actual database structure
 */

export const DATABASE_SCHEMA = `
DATABASE SCHEMA FOR ORIGINBI
============================

## CORE TABLES WITH DATA

### Career & Skills Tables
1. **career_roles** (518 rows) - Career/job roles
   - id, career_role_name, short_description, trait_id, is_active, is_deleted

2. **career_role_tools** (5515 rows) - Tools/technologies for each role  
   - id, career_role_id, tool_name, is_active, is_deleted

### Education & Courses
3. **trait_based_course_details** (470 rows) - Course recommendations
   - id, course_name, compatibility_percentage, trait_id, notes, is_active, is_deleted

4. **departments** (12 rows) - Academic departments
   - id, name, short_name, category

5. **department_degrees** (23 rows) - Degree programs
   - id, department_id, degree_type_id, course_duration

6. **degree_types** (6 rows) - Types of degrees
   - id, name, level

### Assessment System
7. **assessment_questions** (540 rows) - Assessment questions
   - id, question_text_en, category

8. **open_questions** (40 rows) - Open-ended questions
   - id, question_type, media_type, question_text_en

9. **open_question_options** (160 rows) - Options for questions
   - id, open_question_id, option_type, option_text_en, is_valid

10. **assessment_attempts** (varies) - User assessment attempts
    - id, registration_id, program_id, status, score, started_at, completed_at

11. **assessment_sessions** (varies) - Assessment sessions
    - id, program_id, status, question_count

### Programs & Configuration
12. **programs** (6 rows) - Assessment programs
    - id, code, name, description, assessment_title, is_demo, is_active

13. **personality_traits** (12 rows) - Personality trait definitions
    - id, code, blended_style_name, blended_style_desc

### User & Organization
14. **users** (2 rows) - System users
    - id, email, role, is_active, last_login_at

15. **registrations** (varies) - Candidate registrations
    - id, user_id, full_name, gender, status, program_id, assessment_session_id

16. **corporate_accounts** (varies) - Corporate/enterprise accounts
    - id, user_id, company_name, sector_code, total_credits, available_credits

17. **groups** (varies) - Candidate groups
    - id, code, name, corporate_account_id

## IMPORTANT COLUMN NAMING RULES

1. For career_roles: Use "career_role_name" NOT "name"
2. For career_roles: Use "short_description" NOT "description"  
3. Always filter: WHERE is_deleted = false (where applicable)
4. Always filter: WHERE is_active = true (where applicable)

## COMMON QUERY PATTERNS

### Find career roles:
SELECT id, career_role_name, short_description FROM career_roles WHERE is_deleted = false LIMIT 20

### Find courses:
SELECT id, course_name, notes FROM trait_based_course_details WHERE is_deleted = false LIMIT 20

### Find tools for a role:
SELECT crt.tool_name, cr.career_role_name 
FROM career_role_tools crt 
JOIN career_roles cr ON crt.career_role_id = cr.id 
WHERE cr.is_deleted = false LIMIT 20

### Find programs:
SELECT id, name, description FROM programs WHERE is_active = true

### Find candidates/registrations:
SELECT id, full_name, gender, status FROM registrations WHERE is_deleted = false

### Find personality traits:
SELECT id, blended_style_name, blended_style_desc FROM personality_traits WHERE is_active = true

## NOTES
- The system is a career guidance platform
- Users take assessments to discover suitable careers/courses
- Career roles are matched with personality traits
- Courses are recommended based on traits
`;

export const QUERY_EXAMPLES = [
    { question: "List career roles", sql: "SELECT career_role_name, short_description FROM career_roles WHERE is_deleted = false LIMIT 20" },
    { question: "Show courses", sql: "SELECT course_name FROM trait_based_course_details WHERE is_deleted = false LIMIT 20" },
    { question: "Find tools for software developer", sql: "SELECT crt.tool_name FROM career_role_tools crt JOIN career_roles cr ON crt.career_role_id = cr.id WHERE cr.career_role_name ILIKE '%software%' AND cr.is_deleted = false" },
    { question: "How many users", sql: "SELECT COUNT(*) FROM users WHERE is_active = true" },
    { question: "Show programs", sql: "SELECT name, description FROM programs WHERE is_active = true" },
    { question: "Find personality traits", sql: "SELECT blended_style_name, blended_style_desc FROM personality_traits WHERE is_active = true" },
];

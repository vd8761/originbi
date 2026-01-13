export const DATABASE_SCHEMA = `
DATABASE SCHEMA
===============

TABLES WITH DATA:
1. career_role_tools (5515 rows)
   - tool_name, career_role_id
2. career_roles (1068 rows)
   - id, name
3. trait_based_course_details (470 rows)
   - course_name, compatibility_percentage, trait_id
4. assessment_questions (540 rows)
   - question_text_en, category

EMPTY TABLES:
1. registrations (Candidates)
2. assessment_attempts (Scores)
3. corporate_accounts

NOTES:
- Answer queries about "Tools", "Courses", and "Questions" using the tables above.
- "Find employees" will return 0 results. Explain that the registrations table is empty.
`;

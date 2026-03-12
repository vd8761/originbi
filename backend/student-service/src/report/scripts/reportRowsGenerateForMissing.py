import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime

# ==========================================
# CONFIGURATION
# ==========================================
DB_DSN = "postgres://postgres:postgres@localhost:5432/obidatanew"
GROUP_ID = 29 # Change this to the target Group ID (e.g., matching Dept Degree 3)

def get_db_connection():
    return psycopg2.connect(DB_DSN)

def get_completed_users_without_reports(cur, group_id):
    # This query finds sessions that are finished but missing from the reports table
    query = """
        SELECT 
            s.id AS assessment_session_id,
            s.group_id,
            s.program_id,
            l2.id AS assessment_attempt_id,
            l1.metadata AS l1_metadata,
            l1.dominant_trait_id AS l1_dom_trait,
            l2.metadata AS l2_metadata
        FROM assessment_sessions s
        JOIN assessment_attempts l1 ON s.id = l1.assessment_session_id 
            AND l1.assessment_level_id = 1 AND l1.status = 'COMPLETED'
        JOIN assessment_attempts l2 ON s.id = l2.assessment_session_id 
            AND l2.assessment_level_id = 2 AND l2.status = 'COMPLETED'
        LEFT JOIN assessment_reports ar ON s.id = ar.assessment_session_id
        WHERE s.group_id = %s AND ar.id IS NULL;
    """
    cur.execute(query, (group_id,))
    return cur.fetchall()

def generate_report_number(cur, group_id, program_id):
    # Reusing your existing logic from main.py
    cur.execute("SELECT code FROM programs WHERE id = %s", (program_id,))
    program = cur.fetchone()
    program_code = program['code'] if program else "UNK"
    date_str = datetime.now().strftime("%m/%y")
    report_prefix = f"OBI-G{group_id}-{date_str}-{program_code}-"
    
    cur.execute("SELECT COUNT(*) as count FROM assessment_reports WHERE report_number LIKE %s", (report_prefix + '%',))
    count = cur.fetchone()['count']
    return f"{report_prefix}{(count + 1):03d}"

def backfill_reports():
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        users = get_completed_users_without_reports(cur, GROUP_ID)
        print(f"Found {len(users)} completed sessions missing reports.")

        for user in users:
            session_id = user['assessment_session_id']
            
            # Extract data from existing metadata
            l1_meta = user['l1_metadata'] or {}
            l2_meta = user['l2_metadata'] or {}
            
            disc_scores = json.dumps(l1_meta.get('disc_scores', {}))
            agile_scores = json.dumps(l2_meta.get('agile_scores', {}))
            sincerity = l2_meta.get('overall_sincerity', 100.0)
            
            report_num = generate_report_number(cur, user['group_id'], user['program_id'])
            
            insert_query = """
                INSERT INTO assessment_reports (
                    assessment_session_id, report_number, generated_at,
                    disc_scores, agile_scores, level3_scores, level4_scores,
                    overall_sincerity, dominant_trait_id, metadata, created_at, updated_at
                ) VALUES (%s, %s, NOW(), %s, %s, '{}', '{}', %s, %s, '{}', NOW(), NOW())
            """
            cur.execute(insert_query, (
                session_id, report_num, disc_scores, agile_scores, 
                sincerity, user['l1_dom_trait']
            ))
            print(f"Created report {report_num} for Session {session_id}")

            # Update assessment_sessions status and is_report_ready
            update_session_query = """
                UPDATE assessment_sessions
                SET status = 'COMPLETED', is_report_ready = true, updated_at = NOW()
                WHERE id = %s
            """
            cur.execute(update_session_query, (session_id,))
            print(f"Updated Session {session_id} status to COMPLETED and is_report_ready to true")
            
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    backfill_reports()
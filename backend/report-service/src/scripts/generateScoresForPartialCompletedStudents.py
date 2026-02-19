import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime

# ==========================================
# CONFIGURATION
# ==========================================
DB_DSN = "postgres://postgres:postgres@localhost:5432/obidatanew"
GROUP_ID = 29

def get_db_connection():
    return psycopg2.connect(DB_DSN)

def get_target_users(cur, group_id):
    query = """
        SELECT DISTINCT
            s.group_id,
            s.user_id,
            s.id AS assessment_session_id,
            s.program_id,
            l2.id AS assessment_attempt_id,
            l2.status AS assessment_attempt_status,
            l2.metadata AS attempt_metadata,
            l2.assessment_level_id
        FROM
            assessment_sessions s
        JOIN
            assessment_attempts l1 ON s.id = l1.assessment_session_id
            AND l1.assessment_level_id = 1
            AND l1.status = 'COMPLETED'
        JOIN
            assessment_attempts l2 ON s.id = l2.assessment_session_id
            AND l2.assessment_level_id = 2
        WHERE
            s.group_id = %s
            AND l2.status NOT IN ('NOT_STARTED', 'COMPLETED')
            AND EXISTS (
                SELECT 1
                FROM assessment_answers ans
                WHERE ans.assessment_attempt_id = l2.id
                  AND ans.status = 'ANSWERED'
            );
    """
    cur.execute(query, (group_id,))
    return [dict(row) for row in cur.fetchall()]

def calculate_scores(cur, attempt_id):
    # 1. Agile Scores (Recalculated from Options Table)
    # FIX: Joined assessment_question_options to get the true 'score_value' 
    # instead of relying on the potentially buggy 'answer_score' column in the answers table.
    query_agile = """
        SELECT q.category, COALESCE(SUM(o.score_value), 0) as total
        FROM assessment_answers a
        JOIN assessment_questions q ON a.main_question_id = q.id
        LEFT JOIN assessment_question_options o ON a.main_option_id = o.id
        WHERE a.assessment_attempt_id = %s
        GROUP BY q.category
    """
    cur.execute(query_agile, (attempt_id,))
    results = cur.fetchall()
    
    # Initialize with default 0.0 to ensure structure matches Go struct
    agile_scores = {
        "Commitment": 0.0,
        "Courage": 0.0,
        "Focus": 0.0,
        "Openness": 0.0,
        "Respect": 0.0,
        "total": 0.0
    }
    
    total_score = 0.0
    for row in results:
        # Normalize category to match keys (e.g. Ensure "Commitment" matches key "Commitment")
        # This protects against DB casing differences.
        cat_key = row['category']
        val = float(row['total'])
        
        if cat_key in agile_scores:
            agile_scores[cat_key] = val
            total_score += val
        else:
            # Fallback: Try capitalizing if exact match fails
            capitalized_cat = cat_key.capitalize() 
            if capitalized_cat in agile_scores:
                agile_scores[capitalized_cat] = val
                total_score += val

    agile_scores['total'] = total_score

    # 2. Sincerity Index Calculation
    # Counts attention fails and distractions chosen
    query_sincerity = """
        SELECT 
            COUNT(*) FILTER (WHERE is_attention_fail = true) as attention_fails, 
            COUNT(*) FILTER (WHERE is_distraction_chosen = true) as distractions_chosen
        FROM assessment_answers
        WHERE assessment_attempt_id = %s
    """
    cur.execute(query_sincerity, (attempt_id,))
    stats = cur.fetchone()
    
    sincerity_index = 100.0
    sincerity_index -= (float(stats['attention_fails']) * 20.0)    #
    sincerity_index -= (float(stats['distractions_chosen']) * 10.0) #
    if sincerity_index < 0:
        sincerity_index = 0.0
        
    sincerity_class = "NOT_SINCERE"
    if sincerity_index >= 80:
        sincerity_class = "SINCERE"     #
    elif sincerity_index >= 50:
        sincerity_class = "BORDERLINE"  #

    return agile_scores, total_score, sincerity_index, sincerity_class

def generate_report_number(cur, group_id, program_id):
    # Fetch Program Code
    cur.execute("SELECT code FROM programs WHERE id = %s", (program_id,))
    program = cur.fetchone()
    program_code = program['code'] if program else "UNK"

    # Generate Prefix: OBI-G{group_id}-{Month/Year}-{Program code}-
    date_str = datetime.now().strftime("%m/%y")
    report_prefix = f"OBI-G{group_id}-{date_str}-{program_code}-"
    
    # Calculate Sequence
    cur.execute("SELECT COUNT(*) as count FROM assessment_reports WHERE report_number LIKE %s", (report_prefix + '%',))
    count = cur.fetchone()['count']
    seq_num = count + 1
    
    return f"{report_prefix}{seq_num:03d}"

def fix_user_data(conn, user):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        attempt_id = user['assessment_attempt_id']
        session_id = user['assessment_session_id']
        
        print(f"Processing User {user['user_id']} (Session: {session_id}, Attempt: {attempt_id})...")

        # 1. Calculate Scores
        agile_scores, total_score, sincerity, sincerity_class = calculate_scores(cur, attempt_id)
        
        # 2. Prepare Metadata
        meta = user['attempt_metadata']
        if meta is None:
            meta = {}
        elif isinstance(meta, str):
            try:
                meta = json.loads(meta)
            except:
                meta = {}
        # If it's already a dict (psycopg2 jsonb), use it directly
        
        meta['agile_scores'] = agile_scores
        meta['overall_sincerity'] = sincerity
        meta['sincerity_class'] = sincerity_class
        meta['partial_score'] = True 
        
        # 3. Update Assessment Attempt
        update_attempt_query = """
            UPDATE assessment_attempts
            SET status = 'COMPLETED',
                completed_at = NOW(),
                metadata = %s,
                total_score = %s,
                sincerity_index = %s,
                sincerity_class = %s,
                updated_at = NOW()
            WHERE id = %s
        """
        cur.execute(update_attempt_query, (
            json.dumps(meta), 
            total_score, 
            sincerity, 
            sincerity_class, 
            attempt_id
        ))

        # 4. Update Assessment Session
        update_session_query = """
            UPDATE assessment_sessions
            SET status = 'COMPLETED',
                completed_at = NOW(),
                updated_at = NOW()
            WHERE id = %s
        """
        cur.execute(update_session_query, (session_id,))

        # 5. Generate/Update Assessment Report
        cur.execute("SELECT id FROM assessment_reports WHERE assessment_session_id = %s", (session_id,))
        existing_report = cur.fetchone()
        
        if not existing_report:
            report_number = generate_report_number(cur, user['group_id'], user['program_id'])
            
            # Fetch Level 1 data for the report
            cur.execute("""
                SELECT metadata, sincerity_index, dominant_trait_id 
                FROM assessment_attempts 
                WHERE assessment_session_id = %s AND assessment_level_id = 1
            """, (session_id,))
            l1_data = cur.fetchone()
            
            disc_scores = "{}"
            dom_trait = None
            
            if l1_data:
                l1_meta = l1_data['metadata']
                if isinstance(l1_meta, str):
                    try:
                        l1_meta = json.loads(l1_meta) if l1_meta else {}
                    except:
                        l1_meta = {}
                elif l1_meta is None:
                    l1_meta = {}
                
                if 'disc_scores' in l1_meta:
                    disc_scores = json.dumps(l1_meta['disc_scores'])
                dom_trait = l1_data['dominant_trait_id']

            create_report_query = """
                INSERT INTO assessment_reports (
                    assessment_session_id, report_number, generated_at,
                    disc_scores, agile_scores, level3_scores, level4_scores,
                    overall_sincerity, dominant_trait_id, metadata, created_at, updated_at
                ) VALUES (%s, %s, NOW(), %s, %s, '{}', '{}', %s, %s, '{}', NOW(), NOW())
            """
            cur.execute(create_report_query, (
                session_id, 
                report_number, 
                disc_scores, 
                json.dumps(agile_scores), 
                sincerity, 
                dom_trait
            ))
            print(f"  - Created Report: {report_number}")
        else:
            # If report exists, update the missing scores
            print(f"  - Updating existing report ID: {existing_report['id']}")
            update_report_query = """
                UPDATE assessment_reports
                SET agile_scores = %s,
                    overall_sincerity = %s,
                    updated_at = NOW()
                WHERE id = %s
            """
            cur.execute(update_report_query, (json.dumps(agile_scores), sincerity, existing_report['id']))

        conn.commit()
        print("  - Success")
        
    except Exception as e:
        conn.rollback()
        print(f"  - Error processing user {user['user_id']}: {e}")

# ==========================================
# MAIN
# ==========================================
def main():
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        target_users = get_target_users(cur, GROUP_ID)
        cur.close()
        
        print(f"Found {len(target_users)} users to fix in Group {GROUP_ID}")
        
        for user in target_users:
            fix_user_data(conn, user)
            
    finally:
        conn.close()

if __name__ == "__main__":
    main()
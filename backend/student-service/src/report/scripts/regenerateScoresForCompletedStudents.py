import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime

# ==========================================
# CONFIGURATION
# ==========================================
DB_DSN = "postgres://postgres:postgres@localhost:5432/obidatanew"
# Set to a specific group ID if you want to limit the regeneration to one group, or None for all
GROUP_ID = None

def get_db_connection():
    return psycopg2.connect(DB_DSN)

def get_target_users(cur, group_id=None):
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
            assessment_attempts l2 ON s.id = l2.assessment_session_id
            AND l2.assessment_level_id = 2
        WHERE
            l2.status = 'COMPLETED'
            AND EXISTS (
                SELECT 1
                FROM assessment_answers ans
                WHERE ans.assessment_attempt_id = l2.id
                  AND ans.status = 'ANSWERED'
            )
    """
    
    if group_id is not None:
        query += " AND s.group_id = %s"
        cur.execute(query, (group_id,))
    else:
        cur.execute(query)
        
    return [dict(row) for row in cur.fetchall()]

def calculate_scores(cur, attempt_id):
    # Calculate Agile Scores from Options Table
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
        cat_key = row['category'] if row['category'] else ""
        val = float(row['total'])
        
        if cat_key in agile_scores:
            agile_scores[cat_key] = val
            total_score += val
        else:
            capitalized_cat = cat_key.capitalize() 
            if capitalized_cat in agile_scores:
                agile_scores[capitalized_cat] = val
                total_score += val

    agile_scores['total'] = total_score

    # Sincerity Index Calculation
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
    sincerity_index -= (float(stats['attention_fails']) * 20.0)
    sincerity_index -= (float(stats['distractions_chosen']) * 10.0)
    if sincerity_index < 0:
        sincerity_index = 0.0
        
    sincerity_class = "NOT_SINCERE"
    if sincerity_index >= 80:
        sincerity_class = "SINCERE"
    elif sincerity_index >= 50:
        sincerity_class = "BORDERLINE"

    return agile_scores, total_score, sincerity_index, sincerity_class

def regenerate_scores(conn, user):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        attempt_id = user['assessment_attempt_id']
        session_id = user['assessment_session_id']
        
        print(f"Regenerating scores for User {user['user_id']} (Session: {session_id}, Attempt: {attempt_id})...")

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
        
        meta['agile_scores'] = agile_scores
        meta['overall_sincerity'] = sincerity
        meta['sincerity_class'] = sincerity_class
        meta['regenerated_score'] = True 
        
        # 3. Update Assessment Attempt
        update_attempt_query = """
            UPDATE assessment_attempts
            SET metadata = %s,
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

        # 4. Update Assessment Report if exists
        cur.execute("SELECT id FROM assessment_reports WHERE assessment_session_id = %s", (session_id,))
        existing_report = cur.fetchone()
        
        if existing_report:
            print(f"  - Updating existing report ID: {existing_report['id']}")
            update_report_query = """
                UPDATE assessment_reports
                SET agile_scores = %s,
                    overall_sincerity = %s,
                    updated_at = NOW()
                WHERE id = %s
            """
            cur.execute(update_report_query, (json.dumps(agile_scores), sincerity, existing_report['id']))
        else:
            print(f"  - No existing report found for session {session_id}. Skipped updating assessment report.")

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
        
        if GROUP_ID is not None:
            print(f"Found {len(target_users)} completed users to regenerate in Group {GROUP_ID}")
        else:
            print(f"Found {len(target_users)} completed users to regenerate across all groups")
            
        for user in target_users:
            regenerate_scores(conn, user)
            
    finally:
        conn.close()

if __name__ == "__main__":
    main()

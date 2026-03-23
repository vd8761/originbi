import psycopg2
from psycopg2.extras import RealDictCursor
import json

# ==========================================
# CONFIGURATION
# ==========================================
DB_DSN = "postgres://postgres:postgres@localhost:5432/obidatanew"

# Define the user ID you want to calculate the score for
TARGET_USER_ID = 673  # Replace with the actual user_id

def get_db_connection():
    return psycopg2.connect(DB_DSN)

def get_completed_attempts_by_user(cur, user_id):
    """Fetches the completed attempt for a specific user ID."""
    query = """
            SELECT
                id AS attempt_id,
                user_id,
                assessment_session_id,
                metadata
            FROM assessment_attempts
            WHERE assessment_level_id = 2
              AND user_id = %s
              AND status = 'COMPLETED'
            """
    cur.execute(query, (user_id,))
    return cur.fetchall()

def process_attempt(conn, attempt):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        attempt_id = attempt['attempt_id']
        session_id = attempt['assessment_session_id']
        user_id = attempt['user_id']

        # ---------------------------------------------------------
        # 1. FIND THE NUMBER OF ROWS AND DETERMINE THE FACTOR
        # ---------------------------------------------------------
        cur.execute("SELECT COUNT(*) as row_count FROM assessment_answers WHERE assessment_attempt_id = %s", (attempt_id,))
        row_count = cur.fetchone()['row_count']

        if row_count == 0:
            print(f"User {user_id} (Attempt {attempt_id}) has 0 answers. Skipping.")
            return

        # Factor based on multiples of 25 (25->1, 50->2, 75->3, 100->4)
        factor = max(1, row_count // 25)

        # ---------------------------------------------------------
        # 2. GENERATE RAW SCORES
        # ---------------------------------------------------------
        query_agile = """
                      SELECT q.category, COALESCE(SUM(o.score_value), 0) as raw_total
                      FROM assessment_answers a
                               JOIN assessment_questions q ON a.main_question_id = q.id
                               LEFT JOIN assessment_question_options o ON a.main_option_id = o.id
                      WHERE a.assessment_attempt_id = %s
                      GROUP BY q.category
                      """
        cur.execute(query_agile, (attempt_id,))
        agile_results = cur.fetchall()

        query_sincerity = """
                          SELECT
                              COUNT(*) FILTER (WHERE is_attention_fail = true) as raw_attention_fails,
                              COUNT(*) FILTER (WHERE is_distraction_chosen = true) as raw_distractions
                          FROM assessment_answers
                          WHERE assessment_attempt_id = %s
                          """
        cur.execute(query_sincerity, (attempt_id,))
        sincerity_stats = cur.fetchone()

        # ---------------------------------------------------------
        # 3. FIX SCORES (APPLY FACTOR)
        # ---------------------------------------------------------
        agile_scores = {
            "Commitment": 0.0, "Courage": 0.0, "Focus": 0.0,
            "Openness": 0.0, "Respect": 0.0, "total": 0.0
        }

        total_score = 0.0
        for row in agile_results:
            cat_key = row['category'] if row['category'] else ""
            fixed_val = round(float(row['raw_total']) / factor)

            capitalized_cat = cat_key.capitalize()
            if capitalized_cat in agile_scores:
                agile_scores[capitalized_cat] = fixed_val
                total_score += fixed_val

        agile_scores['total'] = total_score

        fixed_attention_fails = float(sincerity_stats['raw_attention_fails'] or 0) / factor
        fixed_distractions = float(sincerity_stats['raw_distractions'] or 0) / factor

        sincerity_index = 100.0 - (fixed_attention_fails * 20.0) - (fixed_distractions * 10.0)
        sincerity_index = max(0.0, sincerity_index)

        sincerity_class = "NOT_SINCERE"
        if sincerity_index >= 80:
            sincerity_class = "SINCERE"
        elif sincerity_index >= 50:
            sincerity_class = "BORDERLINE"

        # ---------------------------------------------------------
        # 4. DISPLAY RESULTS (NO DATABASE UPDATES)
        # ---------------------------------------------------------
        print(f"\n======== RESULTS FOR USER {user_id} ========")
        if factor > 1:
            print(f"Detected {row_count} rows (Factor {factor})")
        else:
            print(f"Detected normal {row_count} rows.")
            
        print("\n--- Calculated Agile Scores ---")
        for trait in ["Commitment", "Courage", "Focus", "Openness", "Respect"]:
            print(f"  {trait}: {agile_scores.get(trait, 0.0)}")
        print(f"  TOTAL  : {agile_scores.get('total', 0.0)}")
        
        print(f"\n--- Sincerity ---")
        print(f"  Sincerity Index : {sincerity_index:.2f}")
        print(f"  Sincerity Class : {sincerity_class}")
        print("=========================================\n")
        
        # We explicitly DO NOT commit or update anything

    except Exception as e:
        conn.rollback()
        print(f"Error processing attempt {attempt.get('attempt_id')}: {e}")
    finally:
        cur.close()

# ==========================================
# MAIN EXECUTION
# ==========================================
def main():
    if not TARGET_USER_ID:
        print("Please set TARGET_USER_ID at the top of the script.")
        return

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        attempts = get_completed_attempts_by_user(cur, TARGET_USER_ID)
        cur.close()

        if not attempts:
            print(f"No completed Level 2 attempt found for User ID {TARGET_USER_ID}.")
            return

        print(f"Found Level 2 attempt for User ID {TARGET_USER_ID}. Beginning processing...")

        for attempt in attempts:
            process_attempt(conn, attempt)

        print("Done.")

    finally:
        conn.close()

if __name__ == "__main__":
    main()

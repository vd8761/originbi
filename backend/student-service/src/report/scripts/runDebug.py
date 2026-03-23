import psycopg2
from psycopg2.extras import RealDictCursor

DB_DSN = "postgres://postgres:postgres@localhost:5432/obidatanew"

def run_debug():
    conn = psycopg2.connect(DB_DSN)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Get attempt ID
    cur.execute("""
        SELECT id FROM assessment_attempts 
        WHERE user_id = 673 AND assessment_level_id = 2 AND status = 'COMPLETED' LIMIT 1
    """)
    attempt_id = cur.fetchone()['id']
    print(f"Analyzing Attempt ID: {attempt_id}")
    
    query = """
        SELECT 
            q.category,
            q.id as question_id,
            COUNT(a.id) as times_answered,
            STRING_AGG(o.option_text_en, ' | ') as selected_options,
            STRING_AGG(CAST(o.score_value as varchar), ' | ') as score_values,
            COALESCE(SUM(o.score_value), 0) as total_question_score
        FROM assessment_answers a
        JOIN assessment_questions q ON a.main_question_id = q.id
        LEFT JOIN assessment_question_options o ON a.main_option_id = o.id
        WHERE a.assessment_attempt_id = %s
        GROUP BY q.category, q.id
        ORDER BY q.category
    """
    
    cur.execute(query, (attempt_id,))
    results = cur.fetchall()
    
    current_category = None
    cat_total = 0
    cat_questions = 0
    
    for row in results:
        if current_category != row['category']:
            if current_category is not None:
                print(f"--- TOTAL FOR {current_category}: {cat_total} (Questions: {cat_questions}) ---\n")
            current_category = row['category']
            cat_total = 0
            cat_questions = 0
            print(f"=== CATEGORY: {current_category} ===")
            
        print(f"Q ID: {row['question_id']}")
        print(f"  Times Answered: {row['times_answered']}")
        print(f"  Options: {row['selected_options']}")
        print(f"  Score Weights: {row['score_values']}")
        print(f"  Score sum for this Q: {row['total_question_score']}\n")
        
        cat_total += row['total_question_score']
        cat_questions += row['times_answered']
        
    if current_category is not None:
        print(f"--- TOTAL FOR {current_category}: {cat_total} (Questions: {cat_questions}) ---\n")
        
run_debug()

import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch

# PostgreSQL connection
conn = psycopg2.connect(
    host="localhost",
    database="obidatanew",
    user="postgres",
    password="postgres",
    port="5432"
)

cur = conn.cursor()

# Load CSV
df = pd.read_csv("trait_based_course_details_remapped.csv")

# Convert NaN to None
df = df.where(pd.notnull(df), None)

# Insert query
query = """
INSERT INTO trait_based_course_details (
    id,
    school_level_id,
    school_stream_id,
    trait_id,
    course_name,
    compatibility_percentage,
    notes,
    metadata,
    is_active,
    is_deleted,
    created_at,
    updated_at
)
VALUES (
    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
)
ON CONFLICT (id) DO UPDATE SET
    school_level_id = EXCLUDED.school_level_id,
    school_stream_id = EXCLUDED.school_stream_id,
    trait_id = EXCLUDED.trait_id,
    course_name = EXCLUDED.course_name,
    compatibility_percentage = EXCLUDED.compatibility_percentage,
    notes = EXCLUDED.notes,
    metadata = EXCLUDED.metadata,
    is_active = EXCLUDED.is_active,
    is_deleted = EXCLUDED.is_deleted,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at;
"""

# Prepare data
records = df.values.tolist()

# Insert batch
execute_batch(cur, query, records)

conn.commit()

cur.close()
conn.close()

print("Inserted successfully.")
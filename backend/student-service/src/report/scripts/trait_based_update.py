import pandas as pd
import psycopg2

# Load CSV
csv_file = "trait_based_course_details_updated.csv"
df = pd.read_csv(csv_file)

# PostgreSQL connection
conn = psycopg2.connect(
    host="localhost",
    database="obidatanew",
    user="postgres",
    password="postgres"
)

cursor = conn.cursor()

inserted_count = 0
failed_count = 0

for _, row in df.iterrows():
    try:
        cursor.execute("""
            INSERT INTO trait_based_course_details (
                school_level_id,
                school_stream_department_id,
                trait_id,
                course_name,
                compatibility_percentage,
                notes
            )
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            row['school_level_id'],
            row['school_stream_department_id'],
            row['trait_id'],
            row['course_name'],
            row['compatibility_percentage'],
            row['notes']
        ))

        inserted_count += 1

    except Exception as e:
        failed_count += 1
        print(f"Failed row: {e}")

# Commit
conn.commit()

cursor.close()
conn.close()

print(f"✅ Inserted rows: {inserted_count}")
print(f"⚠️ Failed rows: {failed_count}")
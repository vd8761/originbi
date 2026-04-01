import pandas as pd
import psycopg2
import json

# -----------------------------
# PostgreSQL connection
# -----------------------------
conn = psycopg2.connect(
    host="localhost",
    database="obidatanew",
    user="postgres",
    password="postgres"
)

cursor = conn.cursor()

# -----------------------------
# CSV file path
# -----------------------------
csv_file = "career_roles_guidance_regenerated.csv"

# -----------------------------
# Load CSV
# -----------------------------
df = pd.read_csv(csv_file)

# -----------------------------
# Table + column names
# -----------------------------
TABLE_NAME = "career_role_guidance_sections"
JSON_COLUMN = "section_content"

# -----------------------------
# Counters
# -----------------------------
updated = 0
skipped = 0

# -----------------------------
# Update loop
# -----------------------------
for _, row in df.iterrows():
    row_id = row["id"]
    json_data = row[JSON_COLUMN]

    try:
        # Validate JSON
        parsed_json = json.loads(json_data)

        # Update row
        cursor.execute(
            f"""
            UPDATE {TABLE_NAME}
            SET {JSON_COLUMN} = %s
            WHERE id = %s
            """,
            (json.dumps(parsed_json), row_id)
        )

        updated += 1

    except Exception as e:
        skipped += 1
        print(f"Skipped id {row_id}: {e}")

# -----------------------------
# Commit changes
# -----------------------------
conn.commit()

# -----------------------------
# Final log
# -----------------------------
print(f"✅ Updated rows: {updated}")
print(f"⚠️ Skipped rows: {skipped}")

# -----------------------------
# Close connection
# -----------------------------
cursor.close()
conn.close()
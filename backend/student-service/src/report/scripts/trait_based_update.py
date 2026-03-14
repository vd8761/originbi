import os
import re
import glob
import pandas as pd
import psycopg2

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
# Trait mapping
# personality_traits.code -> id
# -----------------------------
cursor.execute("SELECT id, code FROM personality_traits")
trait_rows = cursor.fetchall()

trait_map = {row[1]: row[0] for row in trait_rows}

print("\nTrait Mapping Loaded:")
print(trait_map)

# -----------------------------
# Folder path
# -----------------------------
csv_folder = "csv"
csv_files = glob.glob(os.path.join(csv_folder, "*"))

# -----------------------------
# Global counters
# -----------------------------
total_inserted = 0
total_skipped = 0

# -----------------------------
# Process files
# -----------------------------
for file in csv_files:

    filename = os.path.basename(file)

    match = re.search(r'field(\d+)', filename)

    if not match:
        print(f"\nSkipping file (no field id): {filename}")
        continue

    school_stream_field_id = int(match.group(1))

    print(f"\n==============================")
    print(f"Processing: {filename}")
    print(f"Field ID: {school_stream_field_id}")

    inserted = 0
    skipped = 0

    try:

        # Supports CSV and XLSX
        if filename.endswith(".csv"):
            df = pd.read_csv(file)
        elif filename.endswith(".xlsx"):
            df = pd.read_excel(file)
        else:
            print("Unsupported file type")
            continue

        df.columns = [col.strip() for col in df.columns]

        for _, row in df.iterrows():

            trait_code = str(row["trait_code"]).strip()

            if trait_code not in trait_map:
                print(f"Skipped row: trait not found -> {trait_code}")
                skipped += 1
                continue

            trait_id = trait_map[trait_code]

            course_name = str(row["course_name"]).strip()
            compatibility_percentage = int(row["compatibility_percentage"])
            notes = str(row["notes"]).strip()

            cursor.execute("""
                INSERT INTO trait_based_course_details
                (
                    school_level_id,
                    school_stream_field_id,
                    trait_id,
                    course_name,
                    compatibility_percentage,
                    notes
                )
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                2,
                school_stream_field_id,
                trait_id,
                course_name,
                compatibility_percentage,
                notes
            ))

            inserted += 1

        conn.commit()

        print(f"Inserted: {inserted}")
        print(f"Skipped: {skipped}")

        total_inserted += inserted
        total_skipped += skipped

    except Exception as e:
        conn.rollback()
        print(f"Error in {filename}: {e}")

# -----------------------------
# Final summary
# -----------------------------
cursor.close()
conn.close()

print("\n==============================")
print("FINAL SUMMARY")
print(f"Total Inserted: {total_inserted}")
print(f"Total Skipped: {total_skipped}")
print("==============================")
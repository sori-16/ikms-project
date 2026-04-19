import sqlite3
import os

db_path = 'instance/ikms.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM users;")
        rows = cursor.fetchall()
        print(f"Users found: {len(rows)}")
        for row in rows:
            print(row)
    except Exception as e:
        print(f"Error: {e}")
    conn.close()
else:
    print("Database not found")

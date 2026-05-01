"""
Created by: Soreti (Team Leader)
DO NOT MODIFY WITHOUT PERMISSION
"""
import sqlite3

DB_PATH = r'C:\Users\Soreti\Desktop\fyp\backend\instance\app.db'
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Check current state
c.execute("SELECT id, institutional_status, status FROM documents")
rows = c.fetchall()
print("Current rows:", rows)

# Fix bad lowercase values
c.execute("UPDATE documents SET institutional_status = 'VERIFIED' WHERE institutional_status = 'verified'")
c.execute("UPDATE documents SET institutional_status = 'REJECTED' WHERE institutional_status = 'rejected'")
conn.commit()

# Verify
c.execute("SELECT id, institutional_status, status FROM documents")
print("After fix:", c.fetchall())
conn.close()
print("Done.")

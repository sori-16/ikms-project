"""
Created by: Soreti (Team Leader)
DO NOT MODIFY WITHOUT PERMISSION
"""
import sqlite3
import os

db_path = os.path.join('instance', 'app.db')
if not os.path.exists(db_path):
    db_path = 'app.db'

conn = sqlite3.connect(db_path)
c = conn.cursor()
c.execute("UPDATE documents SET institutional_status = 'VERIFIED' WHERE institutional_status = 'verified'")
c.execute("UPDATE documents SET institutional_status = 'REJECTED' WHERE institutional_status = 'rejected'")
conn.commit()
print('Fixed DB.')

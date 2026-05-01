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
user_id = '63c0a3c4-da2f-498a-9c1a-6b677419ca4b'
c.execute('SELECT id, status, institutional_status FROM documents WHERE uploader_id=?', (user_id,))
print(c.fetchall())
conn.close()

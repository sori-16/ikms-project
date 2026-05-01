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
c.execute("UPDATE documents SET status = 'approved' WHERE lower(status) = 'approved'")
c.execute("UPDATE documents SET status = 'pending' WHERE lower(status) = 'pending'")
c.execute("UPDATE documents SET status = 'rejected' WHERE lower(status) = 'rejected'")
c.execute("UPDATE documents SET institutional_status = 'verified' WHERE lower(institutional_status) = 'verified'")
c.execute("UPDATE documents SET institutional_status = 'pending' WHERE lower(institutional_status) = 'pending'")
c.execute("UPDATE documents SET institutional_status = 'rejected' WHERE lower(institutional_status) = 'rejected'")
conn.commit()
print('Fixed all statuses to lowercase.')
conn.close()

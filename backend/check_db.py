"""
Created by: Soreti (Team Leader)
DO NOT MODIFY WITHOUT PERMISSION
"""
import sqlite3

def check_db():
    try:
        conn = sqlite3.connect('instance/app.db')
        c = conn.cursor()
        c.execute("SELECT * FROM affiliation_requests")
        rows = c.fetchall()
        print("Affiliation Requests:", rows)
    except Exception as e:
        print("Error:", e)

check_db()

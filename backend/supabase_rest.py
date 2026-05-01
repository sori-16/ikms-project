"""
Created by: Soreti (Team Leader)
DO NOT MODIFY WITHOUT PERMISSION
"""
import requests
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

class SupabaseREST:
    @staticmethod
    def get(table, params=None):
        url = f"{SUPABASE_URL}/rest/v1/{table}"
        response = requests.get(url, headers=HEADERS, params=params)
        return response.json() if response.status_code == 200 else []

    @staticmethod
    def post(table, data):
        url = f"{SUPABASE_URL}/rest/v1/{table}"
        response = requests.post(url, headers=HEADERS, json=data)
        return response.json() if response.status_code in [201, 204] else None

    @staticmethod
    def patch(table, data, query_params):
        url = f"{SUPABASE_URL}/rest/v1/{table}"
        response = requests.patch(url, headers=HEADERS, json=data, params=query_params)
        return response.json() if response.status_code == 200 else None

    @staticmethod
    def delete(table, query_params):
        url = f"{SUPABASE_URL}/rest/v1/{table}"
        response = requests.delete(url, headers=HEADERS, params=query_params)
        return response.status_code == 204

# Specialized helpers for IKMS
def get_user_by_email(email):
    res = SupabaseREST.get("users", {"email": f"eq.{email}"})
    return res[0] if res else None

def get_all_institutions():
    return SupabaseREST.get("institutions", {"select": "*", "order": "name"})

def get_trending_docs(limit=5):
    return SupabaseREST.get("documents", {
        "status": "eq.approved",
        "select": "*",
        "order": "view_count.desc",
        "limit": limit
    })

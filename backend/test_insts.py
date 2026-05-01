"""
Created by: Soreti (Team Leader)
DO NOT MODIFY WITHOUT PERMISSION
"""
from app import app, db
from supabase_client import supabase
import traceback

with app.app_context():
    try:
        insts = supabase.table("institutions").select("*").execute()
        result = []
        for inst in insts.data:
            iid = inst['id']
            docs = supabase.table("documents").select("id", count="exact").eq("institution_id", iid).execute()
            members = supabase.table("users").select("id", count="exact").eq("institution_id", iid).execute()
            result.append({**inst, "doc_count": docs.count or 0, "member_count": members.count or 0})
        print("Success:", result)
    except Exception as e:
        print("Failed!")
        traceback.print_exc()

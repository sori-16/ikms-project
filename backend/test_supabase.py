import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv('.env')

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

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
    import traceback
    traceback.print_exc()

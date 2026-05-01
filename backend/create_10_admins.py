"""
Created by: Soreti (Team Leader)
DO NOT MODIFY WITHOUT PERMISSION
"""
import os
import sys
import argparse
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

ADMINS = [
    {"name": "Admin Jimma", "email": "jimma_admin@ikms.edu.et", "inst": "Jimma University"},
    {"name": "Admin Bahir Dar", "email": "bdu_admin@ikms.edu.et", "inst": "Bahir Dar University"},
    {"name": "Admin Haramaya", "email": "haramaya_admin@ikms.edu.et", "inst": "Haramaya University"},
    {"name": "Admin Debre Markos", "email": "dmu_admin@ikms.edu.et", "inst": "Debre Markos University"},
    {"name": "Admin Hawassa", "email": "hawassa_admin@ikms.edu.et", "inst": "Hawassa University"},
    {"name": "Admin Dire Dawa", "email": "ddu_admin@ikms.edu.et", "inst": "Dire Dawa University"},
    {"name": "Admin Gondar", "email": "uog_admin@ikms.edu.et", "inst": "University of Gondar"},
    {"name": "Admin Mekelle", "email": "mu_admin@ikms.edu.et", "inst": "Mekelle University"},
    {"name": "Admin Arba Minch", "email": "amu_admin@ikms.edu.et", "inst": "Arba Minch University"},
    {"name": "Admin Adama", "email": "astu_admin@ikms.edu.et", "inst": "Adama Science and Technology University"}
]

def run():
    print("Fetching existing institutions...")
    # Get or create missing institutions
    inst_res = supabase.table("institutions").select("id, name").execute()
    existing_insts = {i['name']: i['id'] for i in inst_res.data}
    
    for admin in ADMINS:
        inst_name = admin['inst']
        if inst_name not in existing_insts:
            print(f"Creating missing institution: {inst_name}")
            new_i = supabase.table("institutions").insert({"name": inst_name}).execute()
            if new_i.data:
                existing_insts[inst_name] = new_i.data[0]['id']
            else:
                print(f"Failed to create {inst_name}")
                continue
                
    for admin in ADMINS:
        email = admin["email"]
        password = "Password123!"
        name = admin["name"]
        inst_name = admin["inst"]
        inst_id = existing_insts.get(inst_name)
        
        print(f"\n--- Processing {email} ---")
        try:
            # 1. Ensure user exists in Auth via signup
            auth_res = supabase.auth.sign_up({
                "email": email, 
                "password": password,
                "options": {
                    "data": {
                        "full_name": name,
                        "role": "inst_admin"
                    }
                }
            })
            
            if not auth_res.user:
                print(f"Auth signup failed for {email} (User might already exist)")
            else:
                print(f"Created/Found Auth account for {email} ID: {auth_res.user.id}")
                
            # If user already existed, getting ID from sign_up is none. We need to query.
            # Using auth.admin is tricky if key is anon, so we just use the public users table 
            # to verify they were written to by the trigger.
            user_res = supabase.table("users").select("id").eq("email", email).execute()
            if not user_res.data:
                print(f"Cannot find {email} in public.users")
                continue
                
            user_id = user_res.data[0]['id']
            
            # Update role and institution_id in public.users
            upd = supabase.table("users").update({
                "role": "inst_admin",
                "institution_id": inst_id,
                "name": name,
                "is_verified": True
            }).eq("id", user_id).execute()
            
            # Update JWT metadata
            try:
                supabase.auth.admin.update_user_by_id(user_id, {"user_metadata": {"role": "inst_admin"}})
            except Exception as meta_ex:
                print(f"(Metadata update skipped due to anon key: {meta_ex})")
                
            print(f"✅ Success: {email} / {password} -> {inst_name}")
            
        except Exception as e:
            print(f"❌ Error setting up {email}: {e}")

if __name__ == "__main__":
    run()

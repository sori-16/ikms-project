"""
Created by: Soreti (Team Leader)
DO NOT MODIFY WITHOUT PERMISSION
"""
import argparse
import sys
from supabase_client import supabase

def promote_user(email, role, inst_name=None):
    print(f"Looking for user with email: {email}")
    
    res = supabase.table("users").select("*").eq("email", email).execute()
    
    if not res.data:
        print(f"❌ User not found in 'public.users'. Have they registered yet?")
        sys.exit(1)
        
    user = res.data[0]
    print(f"Found user: {user['name']} (Current role: {user.get('role', 'none')})")
    
    updates = {"role": role}
    
    if role == "inst_admin":
        # Find institution
        inst_res = supabase.table("institutions").select("id, name").execute()
        if not inst_res.data:
            print("❌ No institutions found in the database. Please create one first.")
            sys.exit(1)
            
        target_inst = None
        if inst_name:
            # Case insensitive search
            for inst in inst_res.data:
                if inst_name.lower() in inst['name'].lower():
                    target_inst = inst
                    break
        else:
            # Default to first available
            target_inst = inst_res.data[0]
            
        if not target_inst:
            print(f"❌ Could not find institution matching '{inst_name}'. Available:")
            for i in inst_res.data:
                print(f"  - {i['name']}")
            sys.exit(1)
            
        updates["institution_id"] = target_inst['id']
        print(f"Associating with Institution: {target_inst['name']}")
    
    # Update role and institution in public.users
    try:
        update_res = supabase.table("users").update(updates).eq("id", user['id']).execute()
        
        # ALSO update the Auth JWT metadata so the frontend knows they are an admin!
        admin_update = supabase.auth.admin.update_user_by_id(
            user['id'], 
            {"user_metadata": {"role": role}}
        )
        
        if update_res.data:
            print(f"✅ Successfully promoted {email} to {role} in Database!")
            print(f"✅ Successfully updated Supabase Auth JWT Metadata!")
            if "institution_id" in updates:
                print(f"✅ Linked admin to institution ID: {updates['institution_id']}")
        else:
            print(f"❌ Failed to update role. Check RLS or permissions.")
    except Exception as e:
        print(f"❌ Error during update: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Promote a user to an Admin role")
    parser.add_argument("email", help="The email of the registered user")
    parser.add_argument("--role", choices=["sys_admin", "inst_admin", "moderator"], default="sys_admin", help="Role to set (default: sys_admin)")
    parser.add_argument("--institution", help="Name of the institution to link (required for inst_admin, default picks first)", default=None)
    
    args = parser.parse_args()
    promote_user(args.email, args.role, args.institution)


import os
from supabase_client import supabase

def diagnose():
    try:
        print("Checking Supabase connection...")
        # 1. Test Database
        print("1. Testing Database access...")
        res = supabase.table("users").select("count", count="exact").limit(1).execute()
        print(f"✅ Database users table access: Total rows {res.count if res.count is not None else 'unknown'}")
        
        # 2. Test Storage
        print("\n2. Testing Storage buckets...")
        buckets = supabase.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        print(f"Buckets found: {bucket_names}")
        
        target_bucket = 'research-papers'
        if target_bucket in bucket_names:
            print(f"✅ Bucket '{target_bucket}' exists.")
        else:
            print(f"❌ Bucket '{target_bucket}' NOT FOUND. Creating it...")
            try:
                supabase.storage.create_bucket(target_bucket, options={'public': True})
                print(f"✅ Bucket '{target_bucket}' created.")
            except Exception as e:
                print(f"❌ Failed to create bucket: {e}")
                
        # 3. Test Storage Upload
        print("\n3. Testing Storage Upload...")
        test_file = "test.txt"
        with open(test_file, "w") as f:
            f.write("test content")
            
        with open(test_file, "rb") as f:
            supabase.storage.from_(target_bucket).upload("test_diag.txt", f.read(), {"content-type": "text/plain"})
            print("✅ Upload test: Success")
            
        print("\n4. Testing Storage Delete...")
        supabase.storage.from_(target_bucket).remove(["test_diag.txt"])
        print("✅ Delete test: Success")
        
    except Exception as e:
        print(f"DIAGNOSTIC FAILED: {e}")

if __name__ == "__main__":
    diagnose()

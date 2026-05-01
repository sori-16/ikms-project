"""
Created by: Soreti (Team Leader)
DO NOT MODIFY WITHOUT PERMISSION
"""
"""
IKMS Unified Diagnostic Tool
Created by: Antigravity AI
Consolidates previous connection and network test scripts.
"""
import os
import socket
import requests
import psycopg2
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

def check_port(host, port):
    """Test if a specific port is open on a host."""
    print(f"📡 Testing {host}:{port}...", end=" ", flush=True)
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(5)
        result = s.connect_ex((host, port))
        s.close()
        if result == 0:
            print("✅ OPEN")
            return True
        else:
            print(f"❌ CLOSED (Code: {result})")
            return False
    except Exception as e:
        print(f"⚠️ ERROR: {e}")
        return False

def test_db_raw():
    """Test raw PostgreSQL connection via psycopg2."""
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("❌ DATABASE_URL missing from .env")
        return False
    
    print(f"🐘 Testing psycopg2 connection...", end=" ", flush=True)
    try:
        conn = psycopg2.connect(db_url, connect_timeout=10)
        conn.close()
        print("✅ SUCCESS")
        return True
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False

def test_sqlalchemy():
    """Test SQLAlchemy engine and basic query."""
    db_url = os.environ.get('DATABASE_URL')
    if not db_url: return False

    print(f"🔗 Testing SQLAlchemy connection...", end=" ", flush=True)
    try:
        engine = create_engine(db_url, connect_args={'connect_timeout': 5})
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            result.fetchone()
        print("✅ SUCCESS")
        return True
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False

def test_supabase_rest():
    """Test Supabase REST API and Storage availability."""
    url = os.environ.get('SUPABASE_URL')
    key = os.environ.get('SUPABASE_KEY')
    if not url or not key:
        print("❌ SUPABASE_URL or SUPABASE_KEY missing from .env")
        return False

    print(f"☁️  Testing Supabase REST API...", end=" ", flush=True)
    try:
        headers = {"apikey": key, "Authorization": f"Bearer {key}"}
        # Test Storage buckets
        resp = requests.get(f"{url}/storage/v1/bucket", headers=headers, timeout=10)
        if resp.status_code == 200:
            print(f"✅ SUCCESS (Buckets found: {len(resp.json())})")
            return True
        else:
            print(f"❌ FAILED (Status: {resp.status_code})")
            return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def run_diagnostics():
    print("-" * 50)
    print("🚀 IKMS UNIFIED DIAGNOSTIC SUITE")
    print("-" * 50)

    # 1. Network Connectivity
    sb_host = os.environ.get('SUPABASE_URL', '').replace('https://', '').split('.')[0] + ".supabase.co"
    db_host = "aws-0-eu-central-1.pooler.supabase.com"
    
    print("\n[STEP 1] Network Checks")
    p443 = check_port(sb_host, 443) if sb_host else False
    p6543 = check_port(db_host, 6543)
    p5432 = check_port(db_host, 5432)

    # 2. Database Checks
    print("\n[STEP 2] Database Connectivity")
    db_raw = test_db_raw()
    db_sa = test_sqlalchemy()

    # 3. Cloud Infrastructure Checks
    print("\n[STEP 3] Cloud Services")
    sb_rest = test_supabase_rest()

    print("\n" + "-" * 50)
    print("📊 SYSTEM HEALTH SUMMARY")
    print("-" * 50)
    
    if db_sa and sb_rest:
        print("✅ ALL SYSTEMS NORMAL: IKMS is ready for production.")
    elif p443 and not (p6543 or p5432):
        print("⚠️  NETWORK BLOCK: Your network allows Web/REST but blocks Database ports.")
    else:
        print("❌ CRITICAL ISSUES FOUND: Please check the logs above.")
    print("-" * 50)

if __name__ == "__main__":
    run_diagnostics()

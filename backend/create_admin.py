#!/usr/bin/env python3
"""
Script to create an admin user in the database.
EDIT THE VALUES BELOW, then run: python create_admin.py
"""

import sys
import uuid
from passlib.context import CryptContext

# ========== CONFIGURATION - EDIT THESE VALUES ==========
ADMIN_USERNAME = "Khanh"  # <-- CHANGE THIS to your desired admin username
ADMIN_PASSWORD = "SportsAnalytics25!"  # <-- CHANGE THIS to your desired admin password
ADMIN_FULL_NAME = ""  # <-- CHANGE THIS if you want a different full name
# ========== END CONFIGURATION ==========

# Setup password hashing - MUST match login.py
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)

def create_admin():
    """Create admin user, team, and association"""
    try:
        # Import after path setup
        from python_ag_grid_backend.database import get_connection
        
        admin_username = ADMIN_USERNAME
        admin_password = ADMIN_PASSWORD
        admin_full_name = ADMIN_FULL_NAME
        
        if not admin_password or admin_password == "your_secure_password_here":
            print("✗ Error: Please set ADMIN_PASSWORD in the script!")
            return False
        
        # Hash the password
        hashed_password = hash_password(admin_password)
        print(f"✓ Password hashed")
        
        # Connect to database
        conn = get_connection()
        cur = conn.cursor()
        print("✓ Connected to database")
        
        # Check if user already exists
        cur.execute("SELECT username FROM users WHERE username = %s", (admin_username,))
        if cur.fetchone():
            print(f"✗ User '{admin_username}' already exists!")
            cur.close()
            conn.close()
            return False
        
        # Insert admin user
        cur.execute(
            "INSERT INTO users (username, hashed_password, full_name) VALUES (%s, %s, %s)",
            (admin_username, hashed_password, admin_full_name)
        )
        print(f"✓ Created user: {admin_username}")
        
        # Get the existing admin team (same as register flow)
        cur.execute(
            "SELECT team_id, team_name FROM teams WHERE team_name = %s LIMIT 1",
            ("test_admin_admin",)
        )
        result = cur.fetchone()
        
        if not result:
            print("✗ Error: 'test_admin_admin' team not found in database!")
            print("  Please create it first or check if it exists.")
            conn.rollback()
            cur.close()
            conn.close()
            return False
        
        # Handle both tuple and dict-like results
        if isinstance(result, dict):
            team_id = result['team_id']
            team_name = result['team_name']
        else:
            team_id = result[0]
            team_name = result[1]
        
        print(f"✓ Found existing team: {team_name} (ID: {team_id})")
        
        # Link user to existing admin team
        cur.execute(
            "INSERT INTO users_teams (user_id, team_id) VALUES (%s, %s)",
            (admin_username, team_id)
        )
        print(f"✓ Linked user to team")
        
        # Commit changes
        conn.commit()
        print("\n✅ Admin user created successfully!")
        print(f"\nLogin credentials:")
        print(f"  Username: {admin_username}")
        print(f"  Password: {admin_password}")
        print(f"\nTeam: {team_name} (same as register flow)")
        
        cur.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("Admin User Creation Script")
    print("=" * 50 + "\n")
    
    success = create_admin()
    sys.exit(0 if success else 1)


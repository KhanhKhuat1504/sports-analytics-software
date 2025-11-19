# database.py
from typing import Optional
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import HTTPException
import os

db_host = 'sportsdatabase.c9wy48s2kma9.us-east-2.rds.amazonaws.com'
db_name = 'sportsdatabase'
db_user = 'postgres'
db_password = 'sportsanalyticspssword'
db_port = 5432

def get_connection():
    return psycopg2.connect(
        host=db_host,
        user=db_user,
        password=db_password,
        port=db_port,
        cursor_factory=RealDictCursor
    )
     
def init_db():
    """Initialize the users, teams, and users_teams tables if they do not exist."""
    conn = get_connection()
    cur = conn.cursor()
    
    # Create users table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            hashed_password TEXT NOT NULL,
            full_name TEXT
        )
    """)
    
    # Create teams table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS teams (
            team_id UUID PRIMARY KEY,
            team_name TEXT NOT NULL,
            sport_type TEXT NOT NULL,
            schema_name TEXT NOT NULL UNIQUE,
            creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            description TEXT
        )
    """)
    
    # Create users_teams junction table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users_teams (
            user_id TEXT NOT NULL,
            team_id UUID NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, team_id),
            FOREIGN KEY (user_id) REFERENCES users(username) ON DELETE CASCADE,
            FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
        )
    """)
    
    conn.commit()
    cur.close()
    conn.close()


def get_user(username: str) -> Optional[dict]:
    """Fetch a user by username."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT username, hashed_password, full_name FROM users WHERE username = %s",
        (username,)
    )
    row = cur.fetchone()   # With RealDictCursor → already a dict
    cur.close()
    conn.close()
    return row   # row is None or a dict like {"username": ..., "hashed_password": ..., "full_name": ...}


def create_user(username: str, hashed_password: str, full_name: str = ""):
    """Insert a new user into the users table."""
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO users (username, hashed_password, full_name) VALUES (%s, %s, %s)",
            (username, hashed_password, full_name)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        if getattr(e, 'pgcode', None) == '23505':  # unique_violation in Postgres
            raise HTTPException(status_code=409, detail="Username already taken")
        raise
    finally:
        cur.close()
        conn.close()
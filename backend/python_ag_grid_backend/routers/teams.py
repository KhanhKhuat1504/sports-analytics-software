from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from python_ag_grid_backend.database import get_connection
from python_ag_grid_backend.db_access.tables_operations import create_schema
from python_ag_grid_backend.routers.login import get_current_team_id, get_current_user
import uuid
import hashlib
from typing import Optional
from jose import jwt
from datetime import datetime, timedelta, timezone

router = APIRouter()

# Configuration
SECRET_KEY = "CHANGE_ME_IN_PRODUCTION"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# -------------------------
# Request models
# -------------------------

class CreateTeamRequest(BaseModel):
    team_name: str = Field(..., min_length=1, description="Display name for the team")
    sport_type: str = Field(..., min_length=1, description="Type of sport (e.g., basketball, football)")
    description: Optional[str] = Field(None, description="Optional team description")


class TeamResponse(BaseModel):
    team_id: str
    team_name: str
    sport_type: str
    schema_name: str
    description: Optional[str]
    creation_date: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# -------------------------
# Helpers
# -------------------------

def sanitize_schema_name(name: str) -> str:
    """
    Convert team name -> safe PostgreSQL schema name.
    E.g. "Los Angeles Lakers" -> "los_angeles_lakers"
    """
    safe = "".join(c if c.isalnum() else "_" for c in name.lower())
    while "__" in safe:
        safe = safe.replace("__", "_")
    return safe.strip("_")


def generate_schema_name(team_name: str, team_id: str) -> str:
    """
    Generate human-readable + unique schema name.
    E.g. "Los Angeles Lakers" + UUID -> "los_angeles_lakers_a7b2c"
    """
    sanitized = sanitize_schema_name(team_name)
    # Get first 5 chars of UUID hash
    hash_suffix = team_id[:5]
    return f"{sanitized}_{hash_suffix}".lower()


def create_access_token(data: dict, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    """Create JWT token with given claims."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def validate_user_team_access(username: str, team_id: str) -> bool:
    """Check if user is a member of the team."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT 1 FROM users_teams WHERE user_id = %s AND team_id = %s",
            (username, team_id)
        )
        exists = cur.fetchone() is not None
        cur.close()
        conn.close()
        return exists
    except:
        return False


# -------------------------
# Routes
# -------------------------

@router.post("/create-team", response_model=Token)
def create_team(req: CreateTeamRequest, current_user = Depends(get_current_user)):
    """
    Create a new team with metadata and schema.
    Generates UUID for team_id, derives schema_name from team_name + UUID hash.
    Returns JWT token with new team as current_team_id.
    
    Requires authentication (JWT token from registration).
    """
    username = current_user.username
    try:
        # Generate UUID for team
        team_id = uuid.uuid4()
        schema_name = generate_schema_name(req.team_name, str(team_id))
        
        # Validate schema name uniqueness
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM teams WHERE schema_name = %s", (schema_name,))
        if cur.fetchone():
            cur.close()
            conn.close()
            raise HTTPException(status_code=400, detail="Schema name collision (retry)")
        
        # Insert team into teams table
        cur.execute(
            """
            INSERT INTO teams (team_id, team_name, sport_type, schema_name, description)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (str(team_id), req.team_name, req.sport_type, schema_name, req.description)
        )
        conn.commit()
        
        # Link user to team in users_teams
        cur.execute(
            """
            INSERT INTO users_teams (user_id, team_id)
            VALUES (%s, %s)
            """,
            (username, str(team_id))
        )
        conn.commit()
        cur.close()
        conn.close()
        
        # Create PostgreSQL schema
        create_schema(schema_name)
        
        # Generate token with new team as current_team_id
        access_token = create_access_token({"sub": username, "current_team_id": str(team_id)})
        
        return {"access_token": access_token, "token_type": "bearer"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create team: {str(e)}")


@router.post("/set-current-team/{team_id}", response_model=Token)
def set_current_team(team_id: str, current_user = Depends(get_current_user)):
    """
    Switch user's current team. Validates membership and returns new JWT with updated current_team_id.
    en
    Requires authentication (JWT token).
    """
    username = current_user.username
    try:
        # Validate user has access to this team
        if not validate_user_team_access(username, team_id):
            raise HTTPException(status_code=403, detail="Access denied to this team")
        
        # Generate new token with updated current_team_id
        access_token = create_access_token({"sub": username, "current_team_id": team_id})
        
        return {"access_token": access_token, "token_type": "bearer"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/user-teams")
def get_user_teams(current_user = Depends(get_current_user)):
    """
    Fetch all teams for the current user with metadata.
    
    Requires authentication (JWT token).
    """
    username = current_user.username
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT 
                t.team_id as id,
                t.team_name as name,
                t.sport_type,
                t.schema_name,
                t.description,
                t.creation_date
            FROM teams t
            JOIN users_teams ut ON t.team_id = ut.team_id
            WHERE ut.user_id = %s
            ORDER BY t.creation_date ASC
            """,
            (username,)
        )
        teams = cur.fetchall()
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "teams": [dict(team) for team in teams] if teams else []
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/delete-team/{team_id}")
def delete_team(team_id: str, current_user = Depends(get_current_user)):
    """
    Delete a team (removes from teams table and users_teams).
    Note: Does NOT delete the schema - use CASCADE parameter if needed.
    
    Requires authentication (JWT token).
    """
    username = current_user.username
    try:
        # Validate user has access to this team
        if not validate_user_team_access(username, team_id):
            raise HTTPException(status_code=403, detail="Access denied to this team")
        
        # Delete from teams table (cascades to users_teams via FK)
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM teams WHERE team_id = %s", (team_id,))
        conn.commit()
        cur.close()
        conn.close()

        return {
            "success": True,
            "message": f"Team '{team_id}' deleted successfully."
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    status,
    Request,
    Form,
    APIRouter,
    HTTPException,
)
from contextlib import asynccontextmanager
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
import uuid
from jose import jwt, JWTError
from passlib.context import CryptContext
from python_ag_grid_backend.database import init_db, get_user, create_user, get_connection
from datetime import datetime, timedelta, timezone
from typing import Optional

router = APIRouter()

# configurations
SECRET_KEY = "CHANGE_ME_IN_PRODUCTION"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


# pydantic models
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None
    is_admin: Optional[bool] = False


class UserPublic(BaseModel):
    username: str
    full_name: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Helper functions (Security)
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(
    data: dict, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES
) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def authenticate_user(username: str, password: str) -> Optional[dict]:
    user = get_user(username)
    if not user or not verify_password(password, user["hashed_password"]):
        return None
    return user


# dependency extracting current user from token
async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserPublic:
    cred_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: Optional[str] = payload.get("sub")
        if username is None:
            raise cred_exc
    except JWTError:
        raise cred_exc

    user = get_user(username)
    if not user:
        raise cred_exc
    return UserPublic(username=user["username"], full_name=user.get("full_name"))


# dependency extracting current team from token
def get_current_team_id(token: str = Depends(oauth2_scheme)) -> str:
    """Extract current_team_id from JWT token."""
    cred_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        team_id: Optional[str] = payload.get("current_team_id")
        if team_id is None:
            raise cred_exc
        return team_id
    except JWTError:
        raise cred_exc


@router.post("/register", status_code=201, response_model=Token, summary="Create a new user")
def register_user(body: UserCreate):
    hashed = hash_password(body.password)
    create_user(body.username, hashed, body.full_name or "")
    # If this registration requests admin mapping, link (or create) a team mapped to the 'public' schema
    if body.is_admin:
        conn = get_connection()
        cur = conn.cursor()
        try:
            # Try to find an existing team mapped to 'public'
            cur.execute("SELECT team_id FROM teams WHERE schema_name = %s LIMIT 1", ("public",))
            row = cur.fetchone()
            if row:
                team_id = row["team_id"]
            else:
                team_id = str(uuid.uuid4())
                # create a simple admin team that points to the public schema
                cur.execute(
                    "INSERT INTO teams (team_id, team_name, sport_type, schema_name, description) VALUES (%s, %s, %s, %s, %s)",
                    (team_id, f"{body.username}_admin", "admin", "public", "Admin mapping to public schema")
                )
                conn.commit()

            # Ensure user -> team mapping exists
            cur.execute(
                "INSERT INTO users_teams (user_id, team_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                (body.username, str(team_id))
            )
            conn.commit()
        finally:
            cur.close()
            conn.close()

        # Return token with current_team_id set to the public-mapped team so the UI will show public tables
        access_token = create_access_token({"sub": body.username, "current_team_id": str(team_id)})
        return {"access_token": access_token, "token_type": "bearer"}

    # Default: return temporary JWT without team_id (for team creation flow)
    access_token = create_access_token({"sub": body.username})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Get user's first team (auto-select first created team)
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT team_id FROM users_teams
        WHERE user_id = %s
        ORDER BY created_at ASC
        LIMIT 1
        """,
        (form_data.username,)
    )
    team_row = cur.fetchone()
    cur.close()
    conn.close()
    
    # If user has no teams, return JWT without current_team_id
    # ProtectedRoute will redirect to /create-first-team
    if not team_row:
        access_token = create_access_token({"sub": user["username"]})
        return {"access_token": access_token, "token_type": "bearer"}
    
    current_team_id = team_row["team_id"]
    access_token = create_access_token({"sub": user["username"], "current_team_id": str(current_team_id)})
    return {"access_token": access_token, "token_type": "bearer"}

# code adapted from GeeksforGeeks article
# https://www.geeksforgeeks.org/python/login-registration-system-with-jwt-in-fastapi/

from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, status, Request, Form
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from contextlib import asynccontextmanager
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from jose import jwt, JWTError
from passlib.context import CryptContext
from database import init_db, get_user, create_user

#configurations
SECRET_KEY = "CHANGE_ME_IN_PRODUCTION"          # Use an env var in real apps
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# App and security setup
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="Sports Login API", lifespan=lifespan)
templates = Jinja2Templates(directory="templates")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")  # token comes from /login

#pydantic models
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None

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

def create_access_token(data: dict, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
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

#Routes - registration, login, and protected endpoint

# HTML registration page (GET)
@app.get("/register-html", response_class=HTMLResponse)
def register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})

# HTML registration form handler (POST)
@app.post("/register-html", response_class=HTMLResponse)
def register_html(request: Request, username: str = Form(...), password: str = Form(...), full_name: str = Form("")):
    try:
        hashed = hash_password(password)
        create_user(username, hashed, full_name)
        return templates.TemplateResponse("register.html", {"request": request, "success": "Registration successful! Please log in."})
    except HTTPException as e:
        return templates.TemplateResponse("register.html", {"request": request, "error": e.detail})

# API registration endpoint
@app.post("/register", status_code=201, summary="Create a new user")
def register_user(body: UserCreate):
    hashed = hash_password(body.password)
    create_user(body.username, hashed, body.full_name or "")
    return {"message": "User registered successfully"}


# HTML login page (GET)
@app.get("/", response_class=HTMLResponse)
def login_page(request: Request, error: Optional[str] = None):
    return templates.TemplateResponse("login.html", {"request": request, "error": error})

# HTML login form handler (POST)
@app.post("/login-html", response_class=HTMLResponse)
def login_html(request: Request, username: str = Form(...), password: str = Form(...)):
    user = authenticate_user(username, password)
    if not user:
        return templates.TemplateResponse("login.html", {"request": request, "error": "Invalid credentials"})
    return templates.TemplateResponse("success.html", {"request": request})

# API login endpoint
@app.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token({"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me", response_model=UserPublic, summary="Get my profile (protected)")
def read_me(current_user: UserPublic = Depends(get_current_user)):
    return current_user


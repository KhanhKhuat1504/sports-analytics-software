# metabase_embed.py
import os, time, jwt
from fastapi import APIRouter
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

METABASE_SITE_URL = os.getenv(
    "METABASE_SITE_URL", "https://metabase-313692349189.us-central1.run.app"
)
METABASE_SECRET_KEY = os.getenv("METABASE_SECRET_KEY")

print("Loaded METABASE_SECRET_KEY:", METABASE_SECRET_KEY)


@router.get("/api/metabase/embed")
def get_embed_url(dashboard_id: int = 2):
    payload = {
        "resource": {"dashboard": dashboard_id},
        "params": {},
        "exp": round(time.time()) + 10 * 60,
    }
    token = jwt.encode(payload, METABASE_SECRET_KEY, algorithm="HS256")
    iframe_url = f"{METABASE_SITE_URL}/embed/dashboard/{token}#bordered=true&titled=true&refresh=60"
    return {"url": iframe_url}

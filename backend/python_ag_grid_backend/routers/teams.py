from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from python_ag_grid_backend.db_access.tables_operations import create_schema, delete_schema, add_table_row


router = APIRouter()


# -------------------------
# Request models
# -------------------------

class CreateTeamRequest(BaseModel):
    username: str
    teamName: str = Field(..., min_length=1)
    teamDesc: str | None = None


class DeleteTeamRequest(BaseModel):
    cascade: bool = False


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


# -------------------------
# Routes
# -------------------------

@router.post("/create-team")
def create_team(req: CreateTeamRequest):
    """
    Create a new schema for a team.
    """
    try:
        schema_name = sanitize_schema_name(req.teamName)
        user_id = req.username

        # add_table_row("teams", {schema_name})
        
        create_schema(schema_name)
        
        add_table_row("users_teams", { "user_id": user_id, "team_id": schema_name})

        return {
            "success": True,
            "schema": schema_name,
            "message": f"Team '{req.teamName}' created (schema: {schema_name})."
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/delete-team/{team_name}")
def delete_team(team_name: str, body: DeleteTeamRequest):
    """
    Delete a team schema. Optional CASCADE.
    """
    try:
        schema_name = sanitize_schema_name(team_name)
        delete_schema(schema_name, cascade=body.cascade)

        return {
            "success": True,
            "message": f"Team '{team_name}' (schema: {schema_name}) deleted."
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

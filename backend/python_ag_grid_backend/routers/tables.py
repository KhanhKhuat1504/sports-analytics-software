from fastapi import APIRouter, HTTPException, Depends
from python_ag_grid_backend.models.models import (
    TableRowUpdateRequest,
    TableRowAddRequest,
    TableRowDeleteRequest,
    CreateTableRequest,
)
from python_ag_grid_backend.db_access.tables_operations import (
    get_table_data,
    get_all_tables_metadata,
    add_table_row,
    update_table_row,
    delete_table_row,
    create_table,
    delete_table,
    get_primary_key_column,
)
import os
from python_ag_grid_backend.routers.login import get_current_team_id, get_current_user, UserPublic
from python_ag_grid_backend.database import get_connection

router = APIRouter()
# TODO:  handle edge cases for endpoints and add delete row endpoint


def get_schema_name_for_team(team_id: str) -> str:
    """Query the teams table to get schema_name for a given team_id."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT schema_name FROM teams WHERE team_id = %s", (team_id,))
        result = cur.fetchone()
        cur.close()
        conn.close()
        
        if not result:
            raise HTTPException(status_code=404, detail="Team not found")
        
        return result["schema_name"]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get team schema: {str(e)}")


@router.get("/get-tables")
def get_tables_metadata(team_id: str = Depends(get_current_team_id)):
    try:
        schema_name = get_schema_name_for_team(team_id)
        return get_all_tables_metadata(schema_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/list-all")
def admin_list_all_tables(current_user: UserPublic = Depends(get_current_user)):
    """Admin-only endpoint: list all tables across all non-system schemas with row counts.

    Admins are determined by the `ADMIN_USERS` environment variable (comma-separated usernames).
    """
    # Simple admin check via environment variable
    admins = [a.strip() for a in os.environ.get("ADMIN_USERS", "").split(",") if a.strip()]
    if current_user.username not in admins:
        raise HTTPException(status_code=403, detail="Admin privileges required")

    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT table_schema, table_name
            FROM information_schema.tables
            WHERE table_type = 'BASE TABLE'
            AND table_schema NOT IN ('pg_catalog', 'information_schema')
            """
        )
        tables = cur.fetchall()

        result = []
        for t in tables:
            schema = t["table_schema"]
            table = t["table_name"]
            # Note: COUNT(*) can be expensive for very large tables
            cur.execute(f'SELECT COUNT(*) FROM "{schema}"."{table}"')
            rows = cur.fetchone()["count"]
            result.append({"schema": schema, "table": table, "rows": rows})

        cur.close()
        conn.close()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create-table")
def create_table_endpoint(req: CreateTableRequest, team_id: str = Depends(get_current_team_id)):
    try:
        schema_name = get_schema_name_for_team(team_id)
        create_table(req.table_name, req.columns, schema_name)
        return {"success": True, "message": f"Table '{req.table_name}' created."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/delete-table/{table_name}")
def delete_table_endpoint(table_name: str, team_id: str = Depends(get_current_team_id)):
    try:
        schema_name = get_schema_name_for_team(team_id)
        delete_table(table_name, schema_name)
        return {"success": True, "message": f"Table '{table_name}' deleted."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/primary-key/{table_name}")
def get_primary_key_endpoint(table_name: str, team_id: str = Depends(get_current_team_id)):
    try:
        schema_name = get_schema_name_for_team(team_id)
        primary_key = get_primary_key_column(table_name, schema_name)
        return {"primary_key": primary_key}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{table_name}")
def add_table_row_endpoint(table_name: str, row: TableRowAddRequest, team_id: str = Depends(get_current_team_id)):
    try:
        schema_name = get_schema_name_for_team(team_id)
        new_row = add_table_row(table_name, row.data, schema_name)
        return {"success": True, "row": new_row}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{table_name}")
def get_table_endpoint(
    table_name: str,
    offset: int = 0,
    limit: int = 1000,
    team_id: str = Depends(get_current_team_id)
):
    """Fetch paginated table data.
    
    Query parameters:
    - offset: Number of rows to skip (default: 0)
    - limit: Maximum rows to return (default: 1000)
    """
    try:
        schema_name = get_schema_name_for_team(team_id)
        data = get_table_data(table_name, schema_name, offset, limit)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{table_name}")
def update_table_row_endpoint(table_name: str, req: TableRowUpdateRequest, team_id: str = Depends(get_current_team_id)):
    try:
        schema_name = get_schema_name_for_team(team_id)
        updated_row = update_table_row(table_name, req.data, schema_name)
        return {"success": True, "row": updated_row}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@router.delete("/{table_name}")
def delete_table_row_endpoint(table_name: str, req: TableRowDeleteRequest):
    try:
        delete_table_row(table_name, req.data)
        return {"success": True, "message": f"Row with primary key '{req.data}' deleted from table '{table_name}'."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

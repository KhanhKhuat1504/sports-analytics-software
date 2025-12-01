from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
import csv, io, itertools
import json
from python_ag_grid_backend.db_access.tables_operations import (
    create_table,
    insert_rows_bulk,
)
from python_ag_grid_backend.routers.login import get_current_team_id
from python_ag_grid_backend.database import get_connection
import re

router = APIRouter()


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


@router.post("/import-csv")
def import_csv(
    file: UploadFile = File(...),
    primary_keys: str = Form(None),
    table_name: str | None = Form(None),
    infer_rows: int = Form(50),
    team_id: str = Depends(get_current_team_id),
):
    """
    POST multipart/form-data:
      - file: csv file
      - table_name (optional): desired table name; fallback to filename
      - infer_rows (optional): how many rows to sample to infer types
    """
    try:
        # Get schema for current team 
        schema_name = get_schema_name_for_team(team_id)
        
        content = file.file.read()
        text = content.decode("utf-8-sig")
        reader = csv.reader(io.StringIO(text))
        headers = next(reader, None)
        if not headers:
            raise HTTPException(status_code=400, detail="CSV has no header row")

        # sanitize column names
        cols = [sanitize_identifier(h) for h in headers]

        # optionally table name from form or filename
        base_name = table_name or (
            file.filename.rsplit(".", 1)[0] if file.filename else "imported_table"
        )
        table = sanitize_identifier(base_name)

        # Parse primary_keys from form
        if primary_keys:
            try:
                # Try to parse as JSON array first
                pk_list = json.loads(primary_keys)
                if not isinstance(pk_list, list):
                    raise ValueError
                pk_set = set([sanitize_identifier(pk) for pk in pk_list])
            except Exception:
                # Fallback: comma-separated string
                pk_set = set(
                    [
                        sanitize_identifier(pk.strip())
                        for pk in primary_keys.split(",")
                        if pk.strip()
                    ]
                )
        else:
            pk_set = set()

        if not pk_set:
            raise HTTPException(
                status_code=400,
                detail="You must select at least one primary key column.",
            )

        all_rows = list(reader)

        # inference helpers
        def infer_type(values):
            has_float = False
            for v in values:
                if v is None or v == "":
                    continue
                v = v.strip()
                if v.lower() in ("true", "false", "t", "f", "0", "1"):
                    continue
                try:
                    int(v)
                    continue
                except:
                    try:
                        float(v)
                        has_float = True
                        continue
                    except:
                        return "VARCHAR(1024)"
            if has_float:
                return "FLOAT"
            return "INTEGER"

        # build column types using all rows for accurate inference
        transposed = (
            list(zip(*([row + [""] * (len(cols) - len(row)) for row in all_rows])))
            if all_rows
            else [[] for _ in cols]
        )
        col_types = []
        for i, col in enumerate(cols):
            values = transposed[i] if i < len(transposed) else []
            # if values empty -> default VARCHAR
            if not any(v.strip() for v in values):
                col_types.append("VARCHAR(1024)")
            else:
                inferred = infer_type(values)
                # treat booleans separately
                if all(
                    (
                        v.strip().lower() in ("true", "false", "t", "f", "0", "1")
                        or v.strip() == ""
                    )
                    for v in values
                ):
                    col_types.append("BOOLEAN")
                else:
                    col_types.append(inferred)

        # prepare create_table columns definition for create_table(table_name, columns)
        create_cols = [
            {
                "name": name,
                "type": typ,
                "isPrimary": "true" if name in pk_set else "false",
            }
            for name, typ in zip(cols, col_types)
        ]

        # create table (create_table uses IF NOT EXISTS)
        create_table(table, create_cols, schema_name)

        # prepare rows aligned to columns and convert empty to None
        rows_to_insert = []
        for row in all_rows:
            # extend or trim to match cols length
            row_aligned = [
                (cell if cell != "" else None)
                for cell in (row + [""] * len(cols))[: len(cols)]
            ]
            rows_to_insert.append(row_aligned)

        # insert in batches to avoid huge single executemany
        batch_size = 500
        for i in range(0, len(rows_to_insert), batch_size):
            insert_rows_bulk(table, cols, rows_to_insert[i : i + batch_size], schema_name)

        return {
            "success": True,
            "table": table,
            "rows": len(rows_to_insert),
            "columns": len(cols),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def sanitize_identifier(name: str) -> str:
    s = re.sub(r"\W+", "_", name).strip("_").lower()
    if s == "":
        s = "col"
    if re.match(r"^\d", s):
        s = f"c_{s}"
    return s

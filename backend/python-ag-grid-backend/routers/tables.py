from fastapi import APIRouter, HTTPException
from models.models import TableRowUpdate, TableRowAdd
from sample_data import tables  # Replace with DB calls in production

router = APIRouter()

#currently using in-memory data structure, TODO: replace with DB operations 

@router.post("/{table_name}")
async def add_table_row(table_name: str, row: TableRowAdd):
    if table_name not in tables:
        raise HTTPException(status_code=404, detail="Table not found")
    new_row = row.data
    # check if the id already exists
    if any(r.get("id") == new_row.get("id") for r in tables[table_name]["rows"]):
        raise HTTPException(status_code=400, detail="Row with this ID already exists")
    tables[table_name]["rows"].append(new_row)
    return {"success": True, "row": new_row}

@router.get("/{table_name}")
async def get_table(table_name: str):
    if table_name not in tables:
        raise HTTPException(status_code=404, detail="Table not found")
    return tables[table_name]

@router.put("/{table_name}")
async def update_table_row(table_name: str, req: TableRowUpdate):
    if table_name not in tables:
        raise HTTPException(status_code=404, detail="Table not found")
    updated_row = req.data

    # Determine the unique key for each table
    key_field = {
        "players": "id",
        "matches": "id",
        "performance": "id"
    }.get(table_name)

    found = False
    for idx, existing in enumerate(tables[table_name]["rows"]):
        if existing.get(key_field) == updated_row.get(key_field):
            tables[table_name]["rows"][idx] = updated_row
            found = True
            break
    if not found:
        tables[table_name]["rows"].append(updated_row)
    return {"success": True}
from fastapi import APIRouter, HTTPException
from models.models import TableRowUpdateRequest, TableRowAddRequest, CreateTableRequest
from db_access.tables_operations import get_table_data, get_all_tables_metadata, add_table_row, update_table_row, create_table, delete_table

router = APIRouter()
#TODO:  handle edge cases for endpoints and add delete row endpoint

@router.get("/get-tables")
def get_tables_metadata():
    try:
        return get_all_tables_metadata()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-table")
def create_table_endpoint(req: CreateTableRequest):
    try:
        create_table(req.table_name, req.columns)
        return {"success": True, "message": f"Table '{req.table_name}' created."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.delete("/delete-table/{table_name}")
def delete_table_endpoint(table_name: str):
    try:
        delete_table(table_name)
        return {"success": True, "message": f"Table '{table_name}' deleted."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{table_name}")
def add_table_row_endpoint(table_name: str, row: TableRowAddRequest):
    try:
        new_row = add_table_row(table_name, row.data)
        return {"success": True, "row": new_row}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{table_name}")
def get_table_endpoint(table_name: str):
    try:
        data = get_table_data(table_name)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{table_name}")
def update_table_row_endpoint(table_name: str, req: TableRowUpdateRequest):
    try:
        updated_row = update_table_row(table_name, req.data)
        return {"success": True, "row": updated_row}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
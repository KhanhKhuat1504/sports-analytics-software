from pydantic import BaseModel
from typing import List, Dict, Any

class TableRowUpdateRequest(BaseModel):
    data: dict
    column_name: str

class TableRowAddRequest(BaseModel):
    data: dict

class TableRowDeleteRequest(BaseModel):
    data: dict

class CreateTableRequest(BaseModel):
    table_name: str
    columns: List[Dict[str, str]]  # [{"name": "id", "type": "SERIAL PRIMARY KEY"}, ...]

# to replace
# from sqlalchemy import Column, Integer, String
# from database import Base

# class Player(Base):
#     __tablename__ = "players"
#     id = Column(Integer, primary_key=True, index=True)
#     name = Column(String)
#     team = Column(String)
#     position = Column(String)
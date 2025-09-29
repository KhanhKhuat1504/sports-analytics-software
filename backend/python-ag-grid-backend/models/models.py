from pydantic import BaseModel
from typing import Dict, Any

class TableRowUpdate(BaseModel):
    data: dict
    column_name: str

class TableRowAdd(BaseModel):
    data: dict
# to replace
# from sqlalchemy import Column, Integer, String
# from database import Base

# class Player(Base):
#     __tablename__ = "players"
#     id = Column(Integer, primary_key=True, index=True)
#     name = Column(String)
#     team = Column(String)
#     position = Column(String)
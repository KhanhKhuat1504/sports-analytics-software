from sqlalchemy import (
    create_engine,
    MetaData,
    Table,
    Column,
    String,
    Integer,
    Float,
    insert,
    inspect,
    text,
)
from dotenv import load_dotenv
# from smolagents import tool as smolagent_tool
# from langchain_core.tools import tool as langchain_tool
import os
from dataclasses import dataclass
from langchain.tools import tool, ToolRuntime

load_dotenv()

DB_URL = os.getenv("DB_URL")
engine = create_engine(DB_URL)

# def desc_table(table_name, engine): 
#     inspector = inspect(engine) 
#     columns = inspector.get_columns(table_name)
    
#     desc = f"The table is named '{table_name}'. Its description is as follows:\n"
#     desc += "    Columns:\n"
#     for col in columns: 
#         desc += f"    - {col['name']}: {col['type']}\n"
#     return desc
    
    
# table_list = "player", "match", "match_player_stat"
# table_description = "\n".join([desc_table(table, engine) for table in table_list])

@tool
def lc_sql_engine(
    query: str        
) -> str:
    """
        Allows you to perform SQL queries on the given tables.
        Returns a string representation of the result.
        
        Args:
            query: The query to perform. This should be correct SQL.
    """
    output = ""
    with engine.connect() as con:
        rows = con.execute(text(query))
        for row in rows:
            output += "\n" + str(row)
    # Return explicit message if no results to prevent message reconstruction issues
    return output if output.strip() else "[No results found]"






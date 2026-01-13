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
    try:
        output = ""
        with engine.begin() as con:
            result = con.execute(text(query))
            
            # SELECT queries 
            if result.returns_rows:
                for row in result:
                    output += "\n" + str(row)
                return output if output.strip() else "[No results found]"
            # INSERT, UPDATE, DELETE
            elif result.rowcount > 0:
                return f"[Query executed successfully. Rows affected {result.rowcount}]"
            # ALTER/DROP/CREATE - result.rowcount = 0 or -1
            else: 
                return f"[Query executed successfully]"
        # Return explicit message if no results to prevent message reconstruction issues
        return output if output.strip() else "[No results found]"
    except Exception as e:
        # Return error message instead of raising to prevent checkpoint pollution
        error_msg = f"[SQL Error: {str(e)}]"
        print(f"SQL execution error: {e}")
        return error_msg






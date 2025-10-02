<<<<<<< HEAD
from database import get_connection

def get_table_data(table_name):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(f'SELECT * FROM "{table_name}"')
            rows = cur.fetchall()
            colnames = [desc[0] for desc in cur.description]
            return {"columns": colnames, "rows": rows}

def add_table_row(table_name, row):
    with get_connection() as conn:
        with conn.cursor() as cur:
            columns = ', '.join(row.keys())
            values = ', '.join(['%s'] * len(row))
            sql = f'INSERT INTO "{table_name}" ({columns}) VALUES ({values}) RETURNING *'
            cur.execute(sql, list(row.values()))
            conn.commit()
            return cur.fetchone()

def update_table_row(table_name, row):
    key_field = get_primary_key_column(table_name)
    if not key_field:
        raise ValueError(f"No primary key found for table '{table_name}'.")

    with get_connection() as conn:
        with conn.cursor() as cur:
            set_fields = [k for k in row.keys() if k != key_field]
            if not set_fields:
                raise ValueError("No fields to update.")
            set_clause = ', '.join([f'"{k}" = %s' for k in set_fields])
            sql = f'UPDATE "{table_name}" SET {set_clause} WHERE "{key_field}" = %s RETURNING *'
            values = [row[k] for k in set_fields] + [row[key_field]]
            cur.execute(sql, values)
            conn.commit()
<<<<<<< Updated upstream
=======
from database import get_connection

def get_table_data(table_name):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(f"SELECT * FROM {table_name}")
            rows = cur.fetchall()
            # Optionally, fetch column names for AG Grid
            colnames = [desc[0] for desc in cur.description]
            return {"columns": colnames, "rows": rows}

def add_table_row(table_name, row):
    with get_connection() as conn:
        with conn.cursor() as cur:
            columns = ', '.join(row.keys())
            values = ', '.join(['%s'] * len(row))
            sql = f"INSERT INTO {table_name} ({columns}) VALUES ({values}) RETURNING *"
            cur.execute(sql, list(row.values()))
            conn.commit()
            return cur.fetchone()

def update_table_row(table_name, row, key_field="id"):
    with get_connection() as conn:
        with conn.cursor() as cur:
            set_clause = ', '.join([f"{k}=%s" for k in row.keys() if k != key_field])
            sql = f"UPDATE {table_name} SET {set_clause} WHERE {key_field}=%s RETURNING *"
            values = [row[k] for k in row if k != key_field] + [row[key_field]]
            cur.execute(sql, values)
            conn.commit()
>>>>>>> 305e8bb (Barebone gradio chatbot page - Embedded as Iframe)
            return cur.fetchone()
=======
            return cur.fetchone()
        
# need to check for the case when there are more than 1 primary keys input by users
def create_table(table_name, columns):
    """
    columns: List of dicts, e.g. [{"name": "id", "type": "SERIAL PRIMARY KEY"}, ...]
    """
    columns_sql = ", ".join([f"{col['name']} {col['type']}" for col in columns])
    sql = f'CREATE TABLE IF NOT EXISTS "{table_name}" ({columns_sql});'
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            conn.commit()
    return True

def delete_table(table_name):
    with get_connection() as conn:
        with conn.cursor() as cur:
            sql = f'DROP TABLE IF EXISTS "{table_name}" CASCADE;'
            cur.execute(sql)
            conn.commit()
    return True

def get_all_tables_metadata():
    with get_connection() as conn:
        with conn.cursor() as cur:
            # Get all user tables
            cur.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_type = 'BASE TABLE'
            """)
            tables = [row['table_name'] for row in cur.fetchall()]

            result = []
            for table_name in tables:
                # Get columns for each table
                cur.execute("""
                    SELECT column_name, data_type
                    FROM information_schema.columns
                    WHERE table_name = %s
                """, (table_name,))
                columns = [{"field": col["column_name"], "type": col["data_type"]} for col in cur.fetchall()]

                # Get row count
                cur.execute(f'SELECT COUNT(*) FROM "{table_name}"')
                rows = cur.fetchone()["count"]

                result.append({
                    "key": table_name,
                    "columns": len(columns),
                    "rows": rows,
                    "columnsDef": columns,
                })
            return result
        
def get_primary_key_column(table_name):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT a.attname
                FROM pg_index i
                JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
                WHERE i.indrelid = %s::regclass AND i.indisprimary
            """, (table_name,))
            result = cur.fetchone()
            return result["attname"] if result else None
>>>>>>> Stashed changes

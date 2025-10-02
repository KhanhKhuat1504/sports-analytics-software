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
            return cur.fetchone()
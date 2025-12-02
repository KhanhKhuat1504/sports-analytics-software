from python_ag_grid_backend.database import get_connection


def get_table_data(table_name, schema_name="public"):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(f'SELECT * FROM "{schema_name}"."{table_name}"')
            rows = cur.fetchall()
            colnames = [desc[0] for desc in cur.description]
            return {
                "columns": colnames,
                "rows": rows
            }


def add_table_row(table_name, row, schema_name="public"):
    with get_connection() as conn:
        with conn.cursor() as cur:
            columns = ", ".join(row.keys())
            values = ", ".join(["%s"] * len(row))
            sql = (
                f'INSERT INTO "{schema_name}"."{table_name}" ({columns}) VALUES ({values}) RETURNING *'
            )
            cur.execute(sql, list(row.values()))
            conn.commit()
            return cur.fetchone()


def update_table_row(table_name, row, schema_name="public"):
    key_field = get_primary_key_column(table_name, schema_name)
    if not key_field:
        raise ValueError(f"No primary key found for table '{table_name}'.")

    with get_connection() as conn:
        with conn.cursor() as cur:
            set_fields = [k for k in row.keys() if k != key_field]
            if not set_fields:
                raise ValueError("No fields to update.")
            set_clause = ", ".join([f'"{k}" = %s' for k in set_fields])
            sql = f'UPDATE "{schema_name}"."{table_name}" SET {set_clause} WHERE "{key_field}" = %s RETURNING *'
            values = [row[k] for k in set_fields] + [row[key_field]]
            cur.execute(sql, values)
            conn.commit()

def delete_table_row(table_name, row, schema_name="public"):
    if not row:
        raise ValueError("No data provided for deletion.")
    where = " AND ".join([f'"{k}" = %s' for k in row.keys()])
    sql = f'DELETE FROM "{schema_name}"."{table_name}" WHERE {where}'
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, list(row.values()))
            conn.commit()
    return {"success": True}


# need to check for the case when there are more than 1 primary keys input by users
def create_table(table_name, columns, schema_name="public"):
    """
    columns: List of dicts, e.g. [{"name": "id", "type": "SERIAL", "isPrimary": True}, ...]
    """
    for col in columns:
        if "isPrimary" in col:
            col["isPrimary"] = str(col["isPrimary"]).lower() == "true"
    # Find all columns marked as primary key
    pk_columns = [col["name"] for col in columns if col.get("isPrimary")]
    if not pk_columns:
        raise ValueError("At least one column must be defined as PRIMARY KEY.")

    # Remove PRIMARY KEY from type if present (to avoid duplicate PK in composite case)
    def clean_type(col):
        t = col["type"].replace("PRIMARY KEY", "").strip()
        return t

    columns_sql_parts = []
    for col in columns:
        col_def = f'"{col["name"]}" {clean_type(col)}'
        columns_sql_parts.append(col_def)

    # Add PRIMARY KEY constraint (supports composite keys)
    if len(pk_columns) == 1:
        # If only one PK, can append PRIMARY KEY to its type for SERIAL, else add constraint
        idx = next(i for i, col in enumerate(columns) if col.get("isPrimary"))
        if "SERIAL" in columns[idx]["type"].upper():
            columns_sql_parts[idx] = f'"{columns[idx]["name"]}" SERIAL PRIMARY KEY'
        else:
            columns_sql_parts.append(f'PRIMARY KEY ("{pk_columns[0]}")')
    else:
        pk_fields = ", ".join([f'"{name}"' for name in pk_columns])
        columns_sql_parts.append(f"PRIMARY KEY ({pk_fields})")

    columns_sql = ", ".join(columns_sql_parts)
    sql = f'CREATE TABLE IF NOT EXISTS "{schema_name}"."{table_name}" ({columns_sql});'

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            conn.commit()
    return True


def delete_table(table_name, schema_name="public"):
    with get_connection() as conn:
        with conn.cursor() as cur:
            sql = f'DROP TABLE IF EXISTS "{schema_name}"."{table_name}" CASCADE;'
            cur.execute(sql)
            conn.commit()
    return True


def get_all_tables_metadata(schema_name="public"):
    with get_connection() as conn:
        with conn.cursor() as cur:
            # Get all user tables in the specified schema
            cur.execute(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = %s
                AND table_type = 'BASE TABLE'
            """,
                (schema_name,)
            )
            tables = [row["table_name"] for row in cur.fetchall()]

            result = []
            for table_name in tables:
                # Get columns for each table
                cur.execute(
                    """
                    SELECT column_name, data_type
                    FROM information_schema.columns
                    WHERE table_name = %s
                    AND table_schema = %s
                """,
                    (table_name, schema_name),
                )
                columns = [
                    {"field": col["column_name"], "type": col["data_type"]}
                    for col in cur.fetchall()
                ]

                # Get row count
                cur.execute(f'SELECT COUNT(*) FROM "{schema_name}"."{table_name}"')
                rows = cur.fetchone()["count"]

                result.append(
                    {
                        "key": table_name,
                        "columns": len(columns),
                        "rows": rows,
                        "columnsDef": columns,
                    }
                )
            return result


def insert_rows_bulk(table_name: str, columns: list[str], rows: list[list], schema_name: str = "public"):
    """
    columns: list of column names (already sanitized)
    rows: list of row-value lists aligned with columns
    """
    cols_quoted = ", ".join([f'"{c}"' for c in columns])
    placeholders = ", ".join(["%s"] * len(columns))
    sql = f'INSERT INTO "{schema_name}"."{table_name}" ({cols_quoted}) VALUES ({placeholders})'
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.executemany(sql, rows)
            conn.commit()
    return True


def get_primary_key_column(table_name, schema_name="public"):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT a.attname
                FROM pg_index i
                JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
                JOIN pg_class c ON c.oid = i.indrelid
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE c.relname = %s AND n.nspname = %s AND i.indisprimary
            """,
                (table_name, schema_name),
            )
            result = cur.fetchone()
            return result["attname"] if result else None

def create_schema(schema_name: str):
    """
    Create a Postgres schema if it does not exist.
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            sql = f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"'
            cur.execute(sql)
            conn.commit()
    return True

def delete_schema(schema_name: str, cascade: bool = False):
    """
    Delete schema. Be careful – CASCADE drops all tables inside.
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            sql = f'DROP SCHEMA IF EXISTS "{schema_name}" {"CASCADE" if cascade else ""}'
            cur.execute(sql)
            conn.commit()
    return True


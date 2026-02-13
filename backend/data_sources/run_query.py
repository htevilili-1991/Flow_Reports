"""
Run read-only SQL and introspect schema for a DataSource.
"""

from datetime import date, datetime
from decimal import Decimal

# Forbidden SQL (read-only enforcement)
FORBIDDEN = {"insert", "update", "delete", "drop", "create", "alter", "truncate", "grant", "revoke", "exec", "execute", ";--", "/*"}
MAX_ROWS = 10_000


def _json_serializable(value):
    if value is None:
        return None
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (str, int, float, bool)):
        return value
    return str(value)


def _check_read_only(sql: str) -> str | None:
    """Return error message if SQL is not read-only."""
    lower = sql.lower().strip()
    for kw in FORBIDDEN:
        if kw in lower:
            return f"Forbidden keyword: {kw}"
    if not lower.startswith("select"):
        return "Only SELECT queries are allowed."
    return None


def get_connection(data_source):
    """Return a DB connection for the given DataSource. Caller must close it."""
    from .connection import test_postgresql, test_mysql, test_sqlite
    config = data_source.config or {}
    db_type = data_source.db_type

    if db_type == "postgresql":
        import psycopg2
        return psycopg2.connect(
            host=config.get("host") or "localhost",
            port=config.get("port") or 5432,
            dbname=config.get("database"),
            user=config.get("user"),
            password=config.get("password") or "",
            connect_timeout=10,
        )
    if db_type == "mysql":
        import pymysql
        return pymysql.connect(
            host=config.get("host") or "localhost",
            port=config.get("port") or 3306,
            user=config.get("user"),
            password=config.get("password") or "",
            database=config.get("database"),
            connect_timeout=10,
        )
    if db_type == "sqlite":
        import sqlite3
        path = config.get("path") or ""
        if not path:
            raise ValueError("SQLite path is required.")
        return sqlite3.connect(path, timeout=10)
    raise ValueError(f"Unsupported db_type: {db_type}")


def run_sql(data_source, sql: str, limit: int = MAX_ROWS):
    """
    Run read-only SQL against the data source. Returns (rows, columns, error).
    rows is list of dicts; columns is list of column names.
    """
    err = _check_read_only(sql)
    if err:
        return [], [], err
    # Ensure LIMIT for safety
    if "limit" not in sql.lower().rstrip().rstrip(";"):
        sql = sql.rstrip().rstrip(";") + f" LIMIT {limit}"
    try:
        conn = get_connection(data_source)
        try:
            cursor = conn.cursor()
            cursor.execute(sql)
            columns = [col[0] for col in cursor.description] if cursor.description else []
            raw = cursor.fetchall()
            rows = [
                {k: _json_serializable(v) for k, v in zip(columns, row)}
                for row in raw
            ]
            return rows, columns, ""
        finally:
            conn.close()
    except Exception as e:
        return [], [], str(e)


def get_schema(data_source):
    """
    Return list of { "name": table_name, "columns": [col1, col2, ...] } for the data source.
    """
    config = data_source.config or {}
    db_type = data_source.db_type

    try:
        conn = get_connection(data_source)
        try:
            cursor = conn.cursor()
            if db_type == "postgresql":
                cursor.execute("""
                    SELECT table_name FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
                    ORDER BY table_name
                """)
                tables = [row[0] for row in cursor.fetchall()]
            elif db_type == "mysql":
                cursor.execute("SHOW TABLES")
                tables = [row[0] for row in cursor.fetchall()]
            elif db_type == "sqlite":
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
                tables = [row[0] for row in cursor.fetchall()]
            else:
                return [], "Unsupported database type"

            result = []
            for table in tables:
                if db_type == "postgresql":
                    cursor.execute("""
                        SELECT column_name FROM information_schema.columns
                        WHERE table_schema = 'public' AND table_name = %s ORDER BY ordinal_position
                    """, (table,))
                    result.append({"name": table, "columns": [row[0] for row in cursor.fetchall()]})
                elif db_type == "mysql":
                    cursor.execute(
                        "SELECT column_name FROM information_schema.columns WHERE table_schema = %s AND table_name = %s ORDER BY ordinal_position",
                        (config.get("database"), table),
                    )
                    result.append({"name": table, "columns": [row[0] for row in cursor.fetchall()]})
                else:
                    cursor.execute(f'PRAGMA table_info("{table}")')
                    cols = [row[1] for row in cursor.fetchall()]
                    result.append({"name": table, "columns": cols})
            return result, ""
        finally:
            conn.close()
    except Exception as e:
        return [], str(e)

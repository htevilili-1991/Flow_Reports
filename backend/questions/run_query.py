"""
Execute read-only SQL and return rows as list of dicts.
"""

from datetime import date, datetime
from decimal import Decimal

from django.db import connection

from .nl_to_sql import validate_and_sanitize_sql


def _json_serializable(value):
    """Convert value to something JSON-serializable."""
    if value is None:
        return None
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (str, int, float, bool)):
        return value
    return str(value)


def run_read_only_query(sql: str):
    """
    Run a read-only SQL query. Returns (rows, error_message).
    rows is a list of dicts (column name -> value), values JSON-serializable.
    """
    sanitized, err = validate_and_sanitize_sql(sql)
    if err:
        return [], err
    try:
        with connection.cursor() as cursor:
            cursor.execute(sanitized)
            columns = [col[0] for col in cursor.description]
            raw_rows = [dict(zip(columns, row)) for row in cursor.fetchall()]
        rows = [
            {k: _json_serializable(v) for k, v in r.items()}
            for r in raw_rows
        ]
        return rows, ""
    except Exception as e:
        return [], str(e)

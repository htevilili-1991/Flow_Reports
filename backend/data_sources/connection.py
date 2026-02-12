"""
Test database connections (PostgreSQL, MySQL, SQLite).
Returns (success: bool, message: str).
"""

import sqlite3


def test_postgresql(host, port, database, user, password):
    try:
        import psycopg2
        conn = psycopg2.connect(
            host=host or "localhost",
            port=port or 5432,
            dbname=database,
            user=user,
            password=password or "",
            connect_timeout=5,
        )
        conn.close()
        return True, "Connection successful."
    except Exception as e:
        return False, str(e)


def test_mysql(host, port, database, user, password):
    try:
        import pymysql
        conn = pymysql.connect(
            host=host or "localhost",
            port=port or 3306,
            user=user,
            password=password or "",
            database=database,
            connect_timeout=5,
        )
        conn.close()
        return True, "Connection successful."
    except Exception as e:
        return False, str(e)


def test_sqlite(path):
    if not path or not path.strip():
        return False, "File path is required."
    try:
        conn = sqlite3.connect(path, timeout=5)
        conn.close()
        return True, "Connection successful."
    except Exception as e:
        return False, str(e)


def test_connection(db_type, config):
    """Test connection from config dict. Returns (success, message)."""
    config = config or {}
    if db_type == "postgresql":
        return test_postgresql(
            config.get("host"),
            config.get("port"),
            config.get("database"),
            config.get("user"),
            config.get("password"),
        )
    if db_type == "mysql":
        return test_mysql(
            config.get("host"),
            config.get("port"),
            config.get("database"),
            config.get("user"),
            config.get("password"),
        )
    if db_type == "sqlite":
        return test_sqlite(config.get("path"))
    return False, f"Unknown database type: {db_type}"
